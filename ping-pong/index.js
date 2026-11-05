
const http = require("node:http");
const fs = require("node:fs");

const PORT = 3000;
const filePath = "/app/shared/count.txt";

let counter = 0;

if (fs.existsSync(filePath)) {
  counter = Number(fs.readFileSync(filePath, "utf8"));
}

http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/pingpong") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`pong ${counter}`);

    counter++;
    fs.writeFileSync(filePath, String(counter));
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(PORT);

