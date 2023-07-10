import { Server } from "socket.io";
import { env } from "~/env.cjs";
import { currentlyTypingSchedule } from "~/server/socket/schedule";
import parser from "~/server/socket/parser";
import type { SocketServer } from "~/server/socket/setup";
import { getAdapter, setupSocket } from "~/server/socket/setup";

void (async () => {
  const port = parseInt(process.env.PORT || "3001", 10);

  const io: SocketServer = new Server(port, {
    cors: {
      origin: env.NEXT_PUBLIC_API_URL,
      credentials: true,
    },
    parser,
    adapter: await getAdapter(),
    transports: ["websocket"],
  });

  io.on("connection", (socket) => {
    console.log(`Connection (${io.engine.clientsCount})`);
    socket.once("disconnect", () => {
      console.log(`Connection (${io.engine.clientsCount})`);
    });
  });

  setupSocket(io);

  console.log(`WebSocket Server listening on ws://localhost:${port}`);

  // Start Schedule
  currentlyTypingSchedule.start();

  // On SIGTERM
  process.on("SIGTERM", () => {
    console.log("SIGTERM");

    // Stop Schedule
    currentlyTypingSchedule.stop();

    // Close WebSocket Server
    io.close();
  });
})();
