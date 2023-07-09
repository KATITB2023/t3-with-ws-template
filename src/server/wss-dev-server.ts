import { Server } from "socket.io";
import { env } from "~/env.cjs";
import { currentlyTypingSchedule } from "~/server/socket/schedule";
import parser from "./socket/parser";
import type { SocketServer } from "./socket/setup";
import { setupSocket } from "./socket/setup";

const port = parseInt(process.env.PORT || "3001", 10);

const io: SocketServer = new Server(port, {
  cors: {
    origin: env.NEXT_PUBLIC_API_URL,
    credentials: true,
  },
  parser,
});

io.on("connection", (socket) => {
  console.log(`Connection (${io.engine.clientsCount})`);
  socket.once("disconnect", () => {
    console.log(`Connection (${io.engine.clientsCount})`);
  });
});

setupSocket(io);

// Start Schedule
currentlyTypingSchedule.start();

console.log(`WebSocket Server listening on ws://localhost:${port}`);

process.on("SIGTERM", () => {
  console.log("SIGTERM");

  // Stop Schedule
  currentlyTypingSchedule.stop();

  // Close WebSocket Server
  io.close();
});
