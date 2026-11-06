
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = process.env.PORT || 3000;
const imagePath = "/app/images/image.jpg";
const cacheTime = 10 * 60 * 1000;

let downloadInProgress = null;

async function getImage() {
  if (fs.existsSync(imagePath)) {
    const fileAge = Date.now() - fs.statSync(imagePath).mtimeMs;

    if (fileAge < cacheTime) {
      return fs.readFileSync(imagePath);
    }
  }

  if (!downloadInProgress) {
    downloadInProgress = (async () => {
      const response = await fetch(
        `https://picsum.photos/1200?random=${Date.now()}`
      );

      if (!response.ok) {
        throw new Error("Image download failed");
      }

      const image = Buffer.from(await response.arrayBuffer());
      const tempPath = `${imagePath}.tmp`;

      fs.writeFileSync(tempPath, image);
      fs.renameSync(tempPath, imagePath);

      return image;
    })().finally(() => {
      downloadInProgress = null;
    });
  }

  return downloadInProgress;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/image") {
    try {
      const image = await getImage();

      res.writeHead(200, {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store"
      });

      res.end(image);
    } catch (error) {
      console.error(error);
      res.writeHead(503);
      res.end("Image unavailable");
    }

    return;
  }

  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, {
      "Content-Type": "text/html"
    });

    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Todo Application</title>
        </head>
        <body>
          <h1>Todo Application</h1>
          <p>Welcome to my Kubernetes Todo App!</p>
          <img src="/image" alt="Random image" width="600">
        </body>
      </html>
    `);

    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});

