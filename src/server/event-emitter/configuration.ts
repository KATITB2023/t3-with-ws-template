import { type Post } from "@prisma/client";
import EventEmitter from "events";

interface MyEvents {
  hello: (data: { greeting: string }) => void;
  add: (data: Post) => void;
  isTypingUpdate: () => void;
}

export interface MyEventEmitter {
  on<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  off<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  once<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  emit<TEv extends keyof MyEvents>(
    event: TEv,
    ...args: Parameters<MyEvents[TEv]>
  ): boolean;
}

export class MyEventEmitter extends EventEmitter {}
