import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import type { SocketResponse } from "~/server/socket/helper";
import type { ClientToServerEvents } from "~/server/socket/setup";
import { socket } from "~/utils/socket";

type GetReturn<T extends keyof ClientToServerEvents> = NonNullable<
  Parameters<ClientToServerEvents[T]>[1]
> extends (data: SocketResponse<infer U>) => void
  ? U
  : never;

/**
 *
 * @param event event name which are registered on serverEvents (created by createEvent) on the server
 * @param options react-query useMutation options
 * @returns react-query useMutation
 *
 * @example
 * ```ts
 * const mutation = useEmit("example", {
 *   onSuccess: (data) => {
 *    console.log(data);
 *  }
 * });
 *
 * mutation.mutate(1);
 *
 * ```
 */
function useEmit<
  T extends keyof ClientToServerEvents,
  TData = Parameters<ClientToServerEvents[T]>[0]
>(
  event: T,
  options?: UseMutationOptions<GetReturn<T>, unknown, TData, unknown>
) {
  const mutation = useMutation((data: TData) => {
    return new Promise<GetReturn<T>>((resolve, reject) => {
      // @ts-expect-error type lying so inference can be easy
      socket.emit(event, data, (res: SocketResponse) => {
        if (res.success) {
          resolve(res.data as GetReturn<T>);
        } else {
          reject(res.error);
        }
      });
    });
  }, options);

  return mutation;
}

export default useEmit;
