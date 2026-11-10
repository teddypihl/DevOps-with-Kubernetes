
const http = require("node:http");

const PORT = Number(process.env.PORT);
const maxTodoLength = Number(process.env.MAX_TODO_LENGTH);

const todos = [
  "Learn Kubernetes",
  "Complete DevOps exercises",
  "Build a Todo application"
];

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/todos") {
    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(JSON.stringify(todos));
    return;
  }

  if (req.method === "POST" && req.url === "/todos") {
    let body = "";

    for await (const chunk of req) {
      body += chunk;

      if (Buffer.byteLength(body) > 10000) {
        res.writeHead(413);
        res.end("Request too large");
        return;
      }
    }

    try {
      const data = JSON.parse(body);
      const todo = data.todo;

      if (
        typeof todo !== "string" ||
        todo.trim().length === 0 ||
        todo.length > maxTodoLength
      ) {
        res.writeHead(400);
        res.end("Invalid todo");
        return;
      }

      todos.push(todo.trim());

      res.writeHead(201, {
        "Content-Type": "application/json"
      });

      res.end(JSON.stringify({
        todo: todo.trim()
      }));
    } catch (error) {
      res.writeHead(400);
      res.end("Invalid JSON");
    }

    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`Todo backend running on port ${PORT}`);
});

