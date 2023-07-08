import EventEmitter from "events";
import { env } from "~/env.cjs";
import { RedisEventEmitter } from "~/server/event-emitter/configuration";

const instantiateEventEmitter = () =>
  env.REDIS_URL
    ? new RedisEventEmitter({
        url: env.REDIS_URL,
      })
    : new EventEmitter();

export type UsedRedisEventEmitter = ReturnType<typeof instantiateEventEmitter>;

const globalForEventEmitter = globalThis as unknown as {
  eventEmitter: UsedRedisEventEmitter | undefined;
};

export const eventEmitter =
  globalForEventEmitter.eventEmitter ?? instantiateEventEmitter();
if (env.NODE_ENV !== "production")
  globalForEventEmitter.eventEmitter = eventEmitter;
