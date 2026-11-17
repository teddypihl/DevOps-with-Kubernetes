const { connect, StringCodec } = require("nats");

const codec = StringCodec();

async function main() {
  const nc = await connect({
    servers: process.env.NATS_URL
  });

  const subscription = nc.subscribe("todos.events", {
    queue: "todo-broadcasters"
  });

  console.log("Broadcaster connected to NATS");

  for await (const message of subscription) {
    try {
      const event = JSON.parse(codec.decode(message.data));

      const text = event.type === "created"
        ? `A todo was created: ${event.todo.content}`
        : `A todo was updated: ${event.todo.content} (done: ${event.todo.done})`;

      const response = await fetch(process.env.WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user: "bot",
          message: text
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }

      console.log("Notification sent:", text);
    } catch (error) {
      console.error("Notification failed:", error.message);
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
