
const http = require("node:http");
const { randomUUID } = require("node:crypto");

const id = randomUUID();

setInterval(() => {
  console.log(`${new Date().toISOString()}: ${id}`);
}, 5000);

http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`${new Date().toISOString()}: ${id}`);
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(3000);

