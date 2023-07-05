import { RedisEventEmitter } from "~/server/event-emitter/configuration";
import { env } from "~/env.cjs";

const instantiateEventEmitter = () => new RedisEventEmitter();

const globalForEventEmitter = globalThis as unknown as {
  eventEmitter: RedisEventEmitter | undefined;
};

export const eventEmitter =
  globalForEventEmitter.eventEmitter ?? instantiateEventEmitter();

if (env.NODE_ENV !== "production")
  globalForEventEmitter.eventEmitter = eventEmitter;
