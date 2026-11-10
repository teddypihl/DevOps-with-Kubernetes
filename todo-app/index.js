
const http = require("node:http");
const fs = require("node:fs");

const PORT = Number(process.env.PORT);
const backendUrl = process.env.TODO_BACKEND_URL;
const imageUrl = process.env.IMAGE_URL;
const imagePath = process.env.IMAGE_PATH;
const cacheTime = Number(process.env.IMAGE_CACHE_MS);
const maxTodoLength = Number(process.env.MAX_TODO_LENGTH);

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function getImage() {
  if (fs.existsSync(imagePath)) {
    const age = Date.now() - fs.statSync(imagePath).mtimeMs;

    if (age < cacheTime) {
      return fs.readFileSync(imagePath);
    }
  }

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error("Failed to download image");
  }

  const image = Buffer.from(await response.arrayBuffer());

  fs.writeFileSync(imagePath, image);

  return image;
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

      if (fs.existsSync(imagePath)) {
        res.writeHead(200, {
          "Content-Type": "image/jpeg",
          "Cache-Control": "no-store"
        });
        res.end(fs.readFileSync(imagePath));
      } else {
        res.writeHead(503);
        res.end("Image unavailable");
      }
    }

    return;
  }

  if (req.method === "GET" && req.url === "/") {
    try {
      const response = await fetch(`${backendUrl}/todos`);

      if (!response.ok) {
        throw new Error("Failed to fetch todos");
      }

      const todos = await response.json();

      const todoItems = todos
        .map(todo => `<li>${escapeHtml(todo)}</li>`)
        .join("\n");

      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
      });

      res.end(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>Todo App</title>
          </head>
          <body>
            <h1>Todo App</h1>

            <img
              src="/image"
              alt="Random image"
              width="600"
            >

            <h2>Create a new Todo</h2>

            <form method="POST" action="/todos">
              <input
                type="text"
                name="todo"
                maxlength="${maxTodoLength}"
                required
              >
              <button type="submit">Send</button>
            </form>

            <h2>Todos</h2>

            <ul>
              ${todoItems}
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

      if (Buffer.byteLength(body) > 10000) {
        res.writeHead(413);
        res.end("Request too large");
        return;
      }
    }

    const params = new URLSearchParams(body);
    const todo = params.get("todo") || "";

    if (
      todo.trim().length === 0 ||
      todo.length > maxTodoLength
    ) {
      res.writeHead(400);
      res.end("Invalid todo");
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          todo: todo.trim()
        })
      });

      if (!response.ok) {
        throw new Error("Failed to create todo");
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
  console.log(`Todo app running on port ${PORT}`);
});

