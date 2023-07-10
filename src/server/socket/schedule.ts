import { schedule } from "node-cron";
import { env } from "~/env.cjs";
import type { SocketServer } from "~/server/socket/setup";
import { currentlyTyping } from "~/server/socket/state";

let io: SocketServer;

export function setupScheduleSocket(socketServer: SocketServer) {
  io = socketServer;
}

export const currentlyTypingSchedule = schedule("*/1 * * * * *", () => {
  let updated = false;
  const currentTime = new Date();

  for (const [id, { lastTyped }] of Object.entries(currentlyTyping)) {
    if (currentTime.getTime() - lastTyped.getTime() > env.TYPING_TIMEOUT) {
      delete currentlyTyping[id];
      updated = true;
    }
  }

  if (updated) io.emit("whoIsTyping", Object.keys(currentlyTyping));
});
