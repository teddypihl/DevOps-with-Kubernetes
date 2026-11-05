
const http = require("node:http");
const fs = require("node:fs");

const filePath = "/app/files/status.txt";

http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(content);
    } catch {
      res.writeHead(503);
      res.end("Log not available yet");
    }
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(3000);

