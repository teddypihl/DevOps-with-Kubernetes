
const http = require("node:http");
const fs = require("node:fs");

const logPath = "/app/files/status.txt";
const countPath = "/app/shared/count.txt";

http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    try {
      const log = fs.readFileSync(logPath, "utf8");

      const count = fs.existsSync(countPath)
        ? fs.readFileSync(countPath, "utf8")
        : "0";

      res.writeHead(200, {
        "Content-Type": "text/plain"
      });

      res.end(`${log}\nPing / Pongs: ${count}`);
    } catch {
      res.writeHead(503);
      res.end("Log not available yet");
    }
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(3000);

