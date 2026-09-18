import "dotenv/config";
import "../database/checkConnection";

import http from "node:http";
import app from "./app";
import { initSocket } from "./socket";

const server = http.createServer(app);

const port = process.env.APP_PORT;

initSocket(server);

server
  .listen(port, () => {
    console.info(`Server is listening on port ${port}`);
  })
  .on("error", (err: Error) => {
    console.error("Error:", err.message);
  });
