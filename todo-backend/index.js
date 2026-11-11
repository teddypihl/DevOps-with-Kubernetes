
const http = require("node:http");
const { Pool } = require("pg");

const PORT = Number(process.env.PORT);
const maxTodoLength = Number(process.env.MAX_TODO_LENGTH);
const maxBodyBytes = Number(process.env.MAX_BODY_BYTES);

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Add the original example todos only if the table is empty.
  await pool.query(`
    INSERT INTO todos (content)
    SELECT content
    FROM (
      VALUES
        ('Learn Kubernetes'),
        ('Complete DevOps exercises'),
        ('Build a Todo application')
    ) AS initial(content)
    WHERE NOT EXISTS (SELECT 1 FROM todos)
  `);

  console.log("Todo database initialized");
}

async function getTodos() {
  const result = await pool.query(
    "SELECT content FROM todos ORDER BY id ASC"
  );

  return result.rows.map(row => row.content);
}

async function addTodo(content) {
  const result = await pool.query(
    "INSERT INTO todos (content) VALUES ($1) RETURNING id, content",
    [content]
  );

  return result.rows[0];
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/todos") {
    try {
      const todos = await getTodos();

      res.writeHead(200, {
        "Content-Type": "application/json"
      });

      res.end(JSON.stringify(todos));
    } catch (error) {
      console.error("Database error:", error);
      res.writeHead(503);
      res.end("Database unavailable");
    }

    return;
  }

  if (req.method === "POST" && req.url === "/todos") {
    let body = "";

    for await (const chunk of req) {
      body += chunk;

      if (Buffer.byteLength(body) > maxBodyBytes) {
        res.writeHead(413);
        res.end("Request too large");
        return;
      }
    }

    let todo;

    try {
      const data = JSON.parse(body);
      todo = data.todo;
    } catch {
      res.writeHead(400);
      res.end("Invalid JSON");
      return;
    }

    if (
      typeof todo !== "string" ||
      todo.trim().length === 0 ||
      todo.length > maxTodoLength
    ) {
      res.writeHead(400);
      res.end("Invalid todo");
      return;
    }

    try {
      const savedTodo = await addTodo(todo.trim());

      res.writeHead(201, {
        "Content-Type": "application/json"
      });

      res.end(JSON.stringify({
        todo: savedTodo.content
      }));
    } catch (error) {
      console.error("Database error:", error);
      res.writeHead(503);
      res.end("Database unavailable");
    }

    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

async function start() {
  try {
    await initializeDatabase();

    server.listen(PORT, () => {
      console.log(`Todo backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

start();

