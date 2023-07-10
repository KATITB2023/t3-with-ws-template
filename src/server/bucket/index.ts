import { type Bucket, Storage } from "@google-cloud/storage";
import { env } from "~/env.cjs";

// This is a helper function that instantiates Google Cloud Storage bucket
const instantiateBucket = () => {
  const storage = new Storage();
  const bucket = storage.bucket(env.BUCKET_NAME);

  return bucket;
};

const globalForBucket = globalThis as unknown as {
  bucket?: Bucket;
};

export const bucket = globalForBucket.bucket ?? instantiateBucket();

if (process.env.NODE_ENV !== "production") globalForBucket.bucket = bucket;
