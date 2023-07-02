import { MyEventEmitter } from "~/server/event-emitter/configuration";
import { env } from "~/env.cjs";

const instantiateEventEmitter = () => new MyEventEmitter();

const globalForEventEmitter = globalThis as unknown as {
  eventEmitter: MyEventEmitter | undefined;
};

export const eventEmitter =
  globalForEventEmitter.eventEmitter ?? instantiateEventEmitter();

if (env.NODE_ENV !== "production")
  globalForEventEmitter.eventEmitter = eventEmitter;
