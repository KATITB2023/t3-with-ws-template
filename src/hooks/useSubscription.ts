import { useCallback, useEffect } from "react";
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
  dependencies: React.DependencyList = []
) {
  const memoizedCallback = useCallback(callback, [callback, ...dependencies]);

  useEffect(() => {
    // @ts-expect-error typing is safe by the interface
    socket.on(event, memoizedCallback);

    return () => {
      // @ts-expect-error typing is safe by the interface
      socket.off(event, memoizedCallback);
    };
  }, [event, memoizedCallback]);
}

export default useSubscription;
