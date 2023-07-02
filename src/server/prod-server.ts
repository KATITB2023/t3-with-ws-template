import { applyWSSHandler } from "@trpc/server/adapters/ws";
import http from "http";
import next from "next";
import { parse } from "url";
import ws from "ws";
import { createTRPCContext } from "~/server/api/trpc";
import { appRouter } from "~/server/api/root";
import { currentlyTypingInterval } from "~/server/event-emitter/schedule";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

void app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    const proto = req.headers["x-forwarded-proto"];
    if (proto && proto === "http") {
      // Redirect to ssl
      const host = req.headers.host ?? "";
      const url =
        (req.headers.url instanceof Array
          ? req.headers.url[0]
          : req.headers.url) ?? "";

      res.writeHead(303, {
        location: `https://${host}${url}`,
      });
      res.end();

      return;
    }

    const parsedUrl = parse(req.url ?? "", true);
    void handle(req, res, parsedUrl);
  });

  const wss = new ws.Server({ server });
  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext: createTRPCContext,
  });

  console.log(
    `Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`
  );

  process.on("SIGTERM", () => {
    console.log("SIGTERM");

    // Clear Interval
    clearInterval(currentlyTypingInterval);

    // Notify clients to reconnect
    handler.broadcastReconnectNotification();
  });

  server.listen(port);
});
