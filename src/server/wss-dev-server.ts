import { applyWSSHandler } from "@trpc/server/adapters/ws";
import ws from "ws";
import { createTRPCContext } from "~/server/api/trpc";
import { appRouter } from "~/server/api/root";
import { currentlyTypingSchedule } from "~/server/event-emitter/schedule";

const port = parseInt(process.env.PORT || "3001", 10);

const wss = new ws.Server({
  port,
});

const handler = applyWSSHandler({
  wss,
  router: appRouter,
  createContext: createTRPCContext,
});

// Start Schedule
currentlyTypingSchedule.start();

wss.on("connection", (ws) => {
  console.log(`Connection (${wss.clients.size})`);
  ws.once("close", () => {
    console.log(`Connection (${wss.clients.size})`);
  });
});

console.log(`WebSocket Server listening on ws://localhost:${port}`);

process.on("SIGTERM", () => {
  console.log("SIGTERM");

  // Stop Schedule
  currentlyTypingSchedule.stop();

  // Notify clients to reconnect
  handler.broadcastReconnectNotification();

  // Close WebSocket Server
  wss.close();
});
