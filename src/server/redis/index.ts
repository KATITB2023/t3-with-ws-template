import { env } from "~/env.cjs";
import { createClient } from "redis";

export class Redis {
  private static client: ReturnType<typeof createClient>;

  public static async getClient() {
    if (!this.client) {
      const redis = createClient({ url: env.REDIS_URL });
      await redis.connect();
      Redis.client = redis;
    }

    return Redis.client;
  }
}
