const http = require("node:http");

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(process.env.GREETING || "Hello");
}).listen(8080);
