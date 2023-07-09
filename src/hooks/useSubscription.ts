/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import type { ServerToClientEvents } from "~/server/socket/setup";
import { socket } from "~/utils/socket";

function useSubscription<T extends keyof ServerToClientEvents>(
  ev: T,
  cb: ServerToClientEvents[T],
  deps: any[] = []
) {
  useEffect(() => {
    // @ts-expect-error typing is safe by the interface
    socket.on(ev, cb);

    return () => {
      // @ts-expect-error typing is safe by the interface
      socket.off(ev, cb);
    };
  }, deps);
}

export default useSubscription;
