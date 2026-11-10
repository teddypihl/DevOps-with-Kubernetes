
const http = require("node:http");
const fs = require("node:fs");

const logPath = "/app/files/status.txt";
const infoPath = "/app/config/information.txt";
const pingPongUrl = "http://ping-pong-svc:2345/count";

http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    try {
      const information = fs.readFileSync(infoPath, "utf8").trim();
      const message = process.env.MESSAGE;
      const log = fs.readFileSync(logPath, "utf8");

      const response = await fetch(pingPongUrl);

      if (!response.ok) {
        throw new Error("Cannot fetch ping count");
      }

      const count = await response.text();

      res.writeHead(200, {
        "Content-Type": "text/plain"
      });

      res.end(
        `file content: ${information}\n` +
        `env variable: MESSAGE=${message}\n` +
        `${log}\n` +
        `Ping / Pongs: ${count}`
      );
    } catch (error) {
      console.error(error);
      res.writeHead(503);
      res.end("Service unavailable");
    }

    return;
  }

  res.writeHead(404);
  res.end("Not Found");
}).listen(3000);

