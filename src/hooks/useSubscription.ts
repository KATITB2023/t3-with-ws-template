/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect } from "react";
import type { ServerToClientEvents } from "~/server/socket/setup";
import { socket } from "~/utils/socket";

function useSubscription<T extends keyof ServerToClientEvents>(
  ev: T,
  cb: ServerToClientEvents[T],
  deps: any[] = []
) {
  const _cb = useCallback(cb, deps);

  useEffect(() => {
    // @ts-expect-error typing is safe by the interface
    socket.on(ev, _cb);

    return () => {
      // @ts-expect-error typing is safe by the interface
      socket.off(ev, _cb);
    };
  }, [_cb]);
}

export default useSubscription;
