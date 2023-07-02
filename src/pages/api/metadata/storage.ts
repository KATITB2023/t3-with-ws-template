import { type MetadataResponse } from "@google-cloud/storage/build/src/nodejs-common";
import { type NextApiHandler } from "next";
import { bucket } from "~/server/bucket";

const handler: NextApiHandler<MetadataResponse> = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405);
    return;
  }

  const metadata = await bucket.getMetadata();
  res.status(200).send(metadata);
};

export default handler;
