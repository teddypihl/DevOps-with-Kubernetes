
const http = require("node:http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });

    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Todo App</title>
        </head>
        <body>
          <h1>Todo Application</h1>
          <p>Welcome to my Kubernetes Todo App!</p>
        </body>
      </html>
    `);
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});

