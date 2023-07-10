/* eslint-disable @typescript-eslint/no-unused-vars */

import type { PrismaClient } from "@prisma/client";
import type { z } from "zod";
import type { SocketClientInServer, SocketServer } from "~/server/socket/setup";
import { prisma } from "~/server/db";

export type SocketResponse<Data = unknown, Error = unknown> =
  | { success: false; error?: Error }
  | { success: true; data?: Data };

export type ServerEvent<
  _EventName extends string,
  _InputSchema extends z.ZodType,
  _Return,
  AuthRequired extends boolean
> = (io: SocketServer, socket: SocketClientInServer<AuthRequired>) => void;

export type ServerEventResolver<T> = T extends ServerEvent<
  infer EventName,
  infer InputSchema,
  infer Return,
  infer _AuthRequired
>
  ? {
      [key in EventName]: (
        input: z.infer<InputSchema>,
        callback?: (data: SocketResponse<Return>) => void
      ) => void;
    }
  : never;

type ExtractKeys<T> = T extends object ? keyof T : never;
type MergeValues<T> = T extends object ? T[keyof T] : never;

type Merge<T extends object> = {
  [K in ExtractKeys<T>]: MergeValues<Extract<T, { [P in K]: unknown }>>;
};

export type ServerEventsResolver<
  T extends readonly ServerEvent<string, z.ZodUndefined, unknown, boolean>[]
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
  AuthRequired extends boolean = false,
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
): ServerEvent<EventName, InputSchema, Return, AuthRequired> {
  return (io, socket) => {
    socket.on(
      name,
      // @ts-expect-error - This is a valid event name
      async (data: unknown, callback?: (response: SocketResponse) => void) => {
        if (authRequired && !socket.data.session) {
          callback?.({ success: false, error: "Unauthenticated" });
          return;
        }

        const validation: z.SafeParseReturnType<unknown, unknown> =
          input?.safeParse(data) ?? {
            success: true,
            data: undefined,
          };

        if (!validation.success) {
          callback?.({ success: false, error: validation.error });
          return;
        }

        try {
          const result = await handler({
            ctx: {
              io,
              client: socket,
              prisma,
            },
            input: validation.data,
          });
          callback?.({ success: true, data: result });
          return;
        } catch (error) {
          callback?.({ success: false, error });
          return;
        }
      }
    );
  };
}
