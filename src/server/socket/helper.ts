/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import type { PrismaClient } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "../db";
import type { SocketClientInServer, SocketServer } from "./setup";

export type SocketResponse<Data = unknown, Error = unknown> =
  | { success: false; error?: Error }
  | { success: true; data?: Data };

export type ServerEvent<
  EventName extends string,
  InputSchema extends z.ZodType,
  Return
> = (
  io: SocketServer,
  socket: SocketClientInServer
) => [EventName, InputSchema, Return];

export type ServerEventResolver<T> = T extends ServerEvent<
  infer EventName,
  infer InputSchema,
  infer Return
>
  ? {
      [key in EventName]: (
        input: z.infer<InputSchema>,
        callback?: (data: SocketResponse<Return>) => void
      ) => void;
    }
  : never;

type ExtractKeys<T> = T extends any ? keyof T : never;
type MergeValues<T> = T extends any ? T[keyof T] : never;

type Merge<T extends object> = {
  [K in ExtractKeys<T>]: MergeValues<Extract<T, { [P in K]: any }>>;
};

export type ServerEventsResolver<
  T extends readonly ServerEvent<any, any, any>[]
> = Merge<ServerEventResolver<T[number]>>;

/**
 *
 * @param name event name that will be registered
 * @param input zod schema to validate the input
 * @param authRequired if true, the client must be authenticated to use this event, and the session will not be null.
 * @param handler the function that runs when frontend emits this event
 *
 * On handler, you can access the socket client, the socket server, and the prisma client.
 * The input schema that you passed will be inferred on the input parameter.
 *
 * @example
 * ```ts
 * const exampleEvent = createEvent({
 *  name: "example",
 *  input: z.number(),
 *  authRequired: true,
 * }, async ({ ctx, input }) => {
 *   const { client, io, prisma } = ctx;
 *   const { session } = client.data;
 *   client.emit("notifyClient", input);
 * });
 * ```
 */
export function createEvent<
  EventName extends string,
  Return,
  AuthRequired extends boolean,
  InputSchema extends z.ZodType = z.ZodUndefined
>(
  {
    name,
    input,
    authRequired,
  }: {
    name: EventName;
    input?: InputSchema;
    authRequired?: AuthRequired;
  },
  handler: ({
    ctx,
    input,
  }: {
    ctx: {
      io: SocketServer;
      client: SocketClientInServer<AuthRequired>;
      prisma: PrismaClient;
    };
    input: z.infer<InputSchema>;
  }) => Promise<Return> | Return
): ServerEvent<EventName, InputSchema, Return> {
  // @ts-expect-error type lying so inference can be easy
  return (io: SocketServer, socket: SocketClientInServer) => {
    // @ts-expect-error - This is a valid event name
    socket.on(name, async (data, callback) => {
      if (authRequired && !socket.data.session) {
        callback?.({ success: false, error: "Unauthenticated" });
        return;
      }
      const validation = input?.safeParse(data) ?? {
        success: true,
        data: undefined,
      };
      if (!validation.success) {
        callback?.({ success: false, error: validation.error });
        return;
      }
      try {
        const result = await handler({
          // @ts-expect-error its already right for session tho
          ctx: { io, client: socket, prisma },
          input: validation.data as z.infer<InputSchema>,
        });
        callback?.({ success: true, data: result });
        return;
      } catch (error) {
        console.error(error);
        callback?.({ success: false, error });
        return;
      }
    });
  };
}
