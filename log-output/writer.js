
const fs = require("node:fs");
const { randomUUID } = require("node:crypto");

const id = randomUUID();
const filePath = "/app/files/status.txt";

function writeLog() {
  const line = `${new Date().toISOString()}: ${id}`;
  fs.writeFileSync(filePath, line);
  console.log(line);
}

writeLog();
setInterval(writeLog, 5000);

