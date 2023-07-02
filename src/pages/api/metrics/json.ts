import { type Metrics } from "@prisma/client/runtime";
import { type NextApiHandler } from "next";
import { prisma } from "~/server/db";

const handler: NextApiHandler<Metrics> = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405);
    return;
  }

  const metrics = await prisma.$metrics.json();
  res.status(200).json(metrics);
};

export default handler;
