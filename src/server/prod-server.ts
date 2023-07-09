import http from "http";
import next from "next";
import { Server } from "socket.io";
import { parse } from "url";
import parser from "./socket/parser";
import { currentlyTypingSchedule } from "./socket/schedule";
import { setupSocket, type SocketServer } from "./socket/setup";

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

  const io: SocketServer = new Server(server, {
    parser,
  });

  setupSocket(io);

  // Start Schedule
  currentlyTypingSchedule.start();

  console.log(
    `Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`
  );

  process.on("SIGTERM", () => {
    console.log("SIGTERM");

    // Stop schedule
    currentlyTypingSchedule.stop();
  });

  server.listen(port);
});
