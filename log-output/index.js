const { randomUUID } = require("node:crypto");

const id = randomUUID();

setInterval(() => {
  console.log(`${new Date().toISOString()}: ${id}`);
}, 5000);
