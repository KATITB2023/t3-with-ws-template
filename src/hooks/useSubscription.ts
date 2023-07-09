/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import type { ServerToClientEvents } from "~/server/socket/setup";
import { socket } from "~/utils/socket";

/**
 *
 * @param event event name which are registered on the server (manual type declaration)
 * @param callback the function that runs when the server emits this event.
 * @param dependencies the dependencies that will be passed to useEffect
 *
 * @example
 * ```ts
 * useSubscription("example", (data) => {
 *  console.log(data);
 * });
 * ```
 */
function useSubscription<T extends keyof ServerToClientEvents>(
  event: T,
  callback: ServerToClientEvents[T],
  dependencies: any[] = []
) {
  useEffect(() => {
    // @ts-expect-error typing is safe by the interface
    socket.on(event, callback);

    return () => {
      // @ts-expect-error typing is safe by the interface
      socket.off(event, callback);
    };
  }, dependencies);
}

export default useSubscription;
