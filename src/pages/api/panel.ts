import type { NextApiRequest, NextApiResponse } from "next";
import { renderTrpcPanel } from "trpc-panel";
import { appRouter } from "~/server/api/root";
import { env } from "~/env.cjs";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405);
    return;
  }

  res.status(200).send(
    renderTrpcPanel(appRouter, {
      url: `${env.NEXT_PUBLIC_API_URL}/api/trpc`,
      transformer: "superjson",
    })
  );
}
