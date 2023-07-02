import { currentlyTyping } from "~/server/event-emitter/state";
import { eventEmitter } from "~/server/event-emitter";
import { env } from "~/env.cjs";

export const currentlyTypingInterval = setInterval(() => {
  let updated = false;
  const currentTime = new Date();

  for (const [id, { lastTyped }] of Object.entries(currentlyTyping)) {
    if (currentTime.getTime() - lastTyped.getTime() > env.TYPING_TIMEOUT) {
      delete currentlyTyping[id];
      updated = true;
    }
  }

  if (updated) eventEmitter.emit("isTypingUpdate");
}, env.TYPING_TIMEOUT);
