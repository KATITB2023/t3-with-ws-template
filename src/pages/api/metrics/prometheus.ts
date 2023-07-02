import { type NextApiHandler } from "next";
import { prisma } from "~/server/db";

const handler: NextApiHandler<string> = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405);
    return;
  }

  const metrics = await prisma.$metrics.prometheus();
  res.status(200).send(metrics);
};

export default handler;
