/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useMutation } from "@tanstack/react-query";
import type { SocketResponse } from "~/server/socket/helper";
import type { ClientToServerEvents } from "~/server/socket/setup";
import { socket } from "~/utils/socket";

type GetReturn<T extends keyof ClientToServerEvents> = NonNullable<
  Parameters<ClientToServerEvents[T]>[1]
> extends (data: SocketResponse<infer U>) => void
  ? U
  : never;

function useEmit<T extends keyof ClientToServerEvents>(
  ev: T,
  callback?: { onSuccess?: (data: GetReturn<T>) => void }
) {
  const mutation = useMutation(
    (data: Parameters<ClientToServerEvents[T]>[0]) => {
      return new Promise<GetReturn<T>>((resolve, reject) => {
        // @ts-expect-error type lying so inference can be easy
        socket.emit(ev, data, (res: SocketResponse) => {
          if (res.success) {
            resolve(res.data as GetReturn<T>);
          } else {
            reject(res.error);
          }
        });
      });
    },
    {
      onSuccess(data) {
        if (callback?.onSuccess) {
          callback.onSuccess(data);
        }
      },
    }
  );

  return mutation;
}

export default useEmit;
