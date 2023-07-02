import { createNextApiHandler } from "@trpc/server/adapters/next";
import { env } from "~/env.cjs";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

// export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError:
    env.NODE_ENV === "development"
      ? ({ path, error }) => {
          console.error(
            `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
          );
        }
      : undefined,
  responseMeta() {
    return {
      headers: {
        "Cache-Control": `s-maxage=${env.S_MAXAGE}, stale-while-revalidate=${env.STALE_WHILE_REVALIDATE}`,
      },
    };
  },
});
