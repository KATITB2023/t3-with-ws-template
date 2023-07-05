import { type Post } from "@prisma/client";
import EventEmitter from "events";

interface MyEvents {
  hello: (data: { greeting: string }) => void;
  add: (data: Post) => void;
  isTypingUpdate: () => void;
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

export class RedisEventEmitter extends EventEmitter implements IEventEmitter {
  constructor() {
    super();
  }
}
