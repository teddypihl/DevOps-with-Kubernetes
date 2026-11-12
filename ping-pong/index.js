
const http = require("node:http");
const { Pool } = require("pg");

const PORT = Number(process.env.PORT || 3000);

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS counters (
      id INTEGER PRIMARY KEY,
      value INTEGER NOT NULL
    )
  `);

  await pool.query(`
    INSERT INTO counters (id, value)
    VALUES (1, 0)
    ON CONFLICT (id) DO NOTHING
  `);
}

async function getCount() {
  const result = await pool.query(
    "SELECT value FROM counters WHERE id = 1"
  );

  return result.rows[0].value;
}

async function incrementCount() {
  const result = await pool.query(`
    UPDATE counters
    SET value = value + 1
    WHERE id = 1
    RETURNING value
  `);

  return result.rows[0].value;
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("OK");
      return;
    }

    if (req.method === "GET" && req.url === "/pingpong") {
      const count = await incrementCount();

      res.writeHead(200, {
        "Content-Type": "text/plain"
      });

      res.end(`pong ${count - 1}`);
      return;
    }

    if (req.method === "GET" && req.url === "/count") {
      const count = await getCount();

      res.writeHead(200, {
        "Content-Type": "text/plain"
      });

      res.end(String(count));
      return;
    }

    res.writeHead(404);
    res.end("Not Found");
  } catch (error) {
    console.error("Database error:", error);

    res.writeHead(503);
    res.end("Database unavailable");
  }
});

async function start() {
  try {
    await initializeDatabase();

    server.listen(PORT, () => {
      console.log(`Ping-pong running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

start();

