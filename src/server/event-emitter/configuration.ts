/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/ban-types */
import { type Post } from "@prisma/client";
import EventEmitter from "events";
import type {
  RedisClientOptions,
  RedisClientType,
  RedisDefaultModules,
  RedisFunctions,
  RedisModules,
  RedisScripts,
} from "redis";
import { createClient } from "redis";
import superjson from "superjson";

interface MyEvents {
  hello: (data: { greeting: string }) => void;
  add: (data: Post) => void;
  isTypingUpdate: () => void;
  newListener: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

interface IEventEmitter {
  on<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  off<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  once<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  emit<TEv extends keyof MyEvents>(
    event: TEv,
    ...args: Parameters<MyEvents[TEv]>
  ): boolean;
}

interface OptionsExtend {
  prefix?: string;
  url: string;
}

export class RedisEventEmitter<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
  >
  extends EventEmitter
  implements IEventEmitter
{
  private pub: RedisClientType<RedisDefaultModules & M, F, S>;
  private sub: RedisClientType<RedisDefaultModules & M, F, S>;
  private prefix: string;
  public loading: Promise<typeof this>;

  constructor(options: RedisClientOptions<M, F, S> & OptionsExtend) {
    super();
    this.pub = createClient(options);
    this.sub = this.pub.duplicate();
    this.prefix = options.prefix ?? "";
    this.loading = this.init();
  }

  private async init() {
    await Promise.all([this.pub.connect(), this.sub.connect()]);
    const onError = (...args: unknown[]) => {
      if (this.listeners("error").length === 0) {
        return;
      }
      super.emit("error", ...args);
    };

    this.pub.on("error", onError);
    this.sub.on("error", onError);
    this.sub.pSubscribe(
      this.prefix + "*",
      (messages: string, pattern: string) => {
        pattern = pattern.slice(this.prefix.length);
        try {
          super.emit(pattern, superjson.parse(messages));
        } catch (err) {
          process.nextTick(() => this.emit("error", err));
        }
      }
    );

    return this;
  }

  emit<TEv extends keyof MyEvents>(
    event: TEv,
    ...args: Parameters<MyEvents[TEv]>
  ) {
    if (event === "newListener" || event === "error")
      return super.emit(event, ...args);

    // @ts-ignore
    this.pub.publish(
      // @ts-ignore
      this.prefix + event,
      superjson.stringify(args)
    );
    return true;
  }

  async close() {
    await this.pub.quit();
    this.pub.unref();
    await this.sub.quit();
    this.sub.unref();
  }
}
