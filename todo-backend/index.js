
const http = require("node:http");

const PORT = 3000;

const todos = [
  "Learn Kubernetes",
  "Complete DevOps exercises",
  "Build a Todo application"
];

http.createServer(async (req, res) => {
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
      if (body.length > 10000) {
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
      todo.length > 140
    ) {
      res.writeHead(400);
      res.end("Todo must contain 1-140 characters");
      return;
    }

    todos.push(todo.trim());

    res.writeHead(201, {
      "Content-Type": "application/json"
    });

    res.end(JSON.stringify({ todo: todo.trim() }));
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
}).listen(PORT, () => {
  console.log(`Todo backend running on port ${PORT}`);
});

