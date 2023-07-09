import type { Post } from "@prisma/client";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import type { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { createClient } from "redis";
import type { Server, Socket } from "socket.io";
import { env } from "~/env.cjs";
import { isTypingEvent, postEvent } from "./events/post";
import type { ServerEventsResolver } from "./helper";
import { setupScheduleSocket } from "./schedule";

// add server events here
/**
 * @description server events are events that are emmited from the client to the server.
 * server event is created by calling `createEvent` function. After creating the event, add it to the `serverEvents` array.
 * The types will be inferred and showed up in useEmit on client.
 *
 * @summary
 * DONT FORGET TO ADD THE EVENT TO THIS ARRAY
 */
const serverEvents = [postEvent, isTypingEvent] as const;

/**
 * @description
 * This type is inferred from the `serverEvents` array.
 * From frontend, you can use `useEmit` hook to emit the event.
 * From backend, all of the events are created by using `createEvent` function.
 */
export type ClientToServerEvents = ServerEventsResolver<typeof serverEvents>;

/**
 * @description
 * This type must be manually created by server to make omit event to client.
 * Every event included in this type can be used by frontend using `useSubscription` hook.
 * From backend, types here are required so that server can do `io.emit` or `client.emit` to client.
 *
 * @example
 * ```ts
 * export type ServerToClientEvents = {
 *  hello: (name: string) => void;
 * };
 *
 * // frontend
 * const { data } = useSubscription("hello", (name: string) => {
 *   console.log(name);
 * });
 *
 * // backend
 * io.emit("hello", "world");
 * client.emit("hello", "world");
 * ```
 */
export type ServerToClientEvents = {
  hello: (name: string) => void;
  whoIsTyping: (data: string[]) => void;
  add: (post: Post) => void;
};

interface InterServerEvents {
  ping: () => void;
}

/**
 * @description
 * This type is used to store data on socket client.
 *
 * @example
 * ```ts
 * const userId = client.data.session.user.id
 * ```
 */
export type SocketData<AuthRequired = false> = {
  session: AuthRequired extends true ? Session : Session | null;
};

/**
 * @description
 * Socket io server. Can be used to emit event to all clients or to specific client.
 *
 * @example
 * ```ts
 * // emit to all clients
 * io.emit("hello", "world");
 *
 * // emit to specific client
 * io.to(client.id).emit("hello", "world");
 * ```
 */
export type SocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

/**
 * @description
 * Socket io client connection on the server. Indicating client state on the server.
 * client.id is unique for each socket connection.
 *
 * @example
 * ```ts
 * // emit to the client
 * client.emit("hello", "world");
 * // above is equivalent to
 * io.to(client.id).emit("hello", "world");
 *
 * // emit to all clients except the client
 * client.broadcast.emit("hello", "world");
 * // above is equivalent to
 * io.except(client.id).emit("hello", "world");
 *
 * ```
 */
export type SocketClientInServer<AuthRequired = false> = Socket<
  never,
  ServerToClientEvents,
  InterServerEvents,
  SocketData<AuthRequired>
>;

export function setupSocket(io: SocketServer) {
  setupScheduleSocket(io);
  io.use((socket, next) => {
    getSession({ req: socket.request })
      .then((session) => {
        socket.data.session = session as Session;
        next();
      })
      .catch(next);
  });

  // setup all socket events here
  io.on("connection", (socket) => {
    serverEvents.forEach((event) => event(io, socket));
  });
}

export async function getAdapter() {
  if (!env.REDIS_URL) return;
  const redisClient = createClient({
    url: env.REDIS_URL,
  });

  await redisClient.connect();
  return createAdapter(redisClient);
}
