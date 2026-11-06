
const http = require("node:http");

const PORT = 3000;
let counter = 0;

http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/pingpong") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`pong ${counter}`);
    counter++;
    return;
  }

  if (req.method === "GET" && req.url === "/count") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(String(counter));
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
}).listen(PORT, () => {
  console.log(`Ping-pong running on port ${PORT}`);
});

