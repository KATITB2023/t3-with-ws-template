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
const serverEvents = [postEvent, isTypingEvent] as const;

export type ClientToServerEvents = ServerEventsResolver<typeof serverEvents>;

export type ServerToClientEvents = {
  hello: (name: string) => void;
  whoIsTyping: (data: string[]) => void;
  add: (post: Post) => void;
};

interface InterServerEvents {
  ping: () => void;
}

export type SocketData<AuthRequired = false> = {
  session: AuthRequired extends true ? Session : Session | null;
};

export type SocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
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
