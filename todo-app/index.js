
const http = require("node:http");
const fs = require("node:fs");

const PORT = process.env.PORT || 3000;
const imagePath = "/app/images/image.jpg";
const cacheTime = 10 * 60 * 1000;

const backendUrl = "http://todo-backend-svc:2345";

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

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
    try {
      const response = await fetch(`${backendUrl}/todos`);

      if (!response.ok) {
        throw new Error("Unable to fetch todos");
      }

      const todos = await response.json();

      const todoList = todos
        .map(todo => `<li>${escapeHtml(todo)}</li>`)
        .join("\n");

      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
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

            <h2>New Todo</h2>

            <form action="/todos" method="POST">
              <input
                type="text"
                name="todo"
                maxlength="140"
                placeholder="Enter a todo"
                required
              >

              <button type="submit">Send</button>
            </form>

            <h2>Todos</h2>

            <ul>
              ${todoList}
            </ul>
          </body>
        </html>
      `);
    } catch (error) {
      console.error(error);
      res.writeHead(503);
      res.end("Todo backend unavailable");
    }

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

    const params = new URLSearchParams(body);
    const todo = params.get("todo") || "";

    if (todo.trim().length === 0 || todo.length > 140) {
      res.writeHead(400);
      res.end("Todo must contain 1-140 characters");
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ todo })
      });

      if (!response.ok) {
        throw new Error("Unable to create todo");
      }

      res.writeHead(303, {
        Location: "/"
      });

      res.end();
    } catch (error) {
      console.error(error);
      res.writeHead(503);
      res.end("Todo backend unavailable");
    }

    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

