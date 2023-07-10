/* eslint-disable @typescript-eslint/no-var-requires */

const { createEnv } = require("@t3-oss/env-nextjs");
const { z } = require("zod");

exports.env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().min(1).optional(),
    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string().min(1) : z.string().url()
    ),
    SESSION_MAXAGE: z.preprocess(
      // If SESSION_MAXAGE is not set, set it to 30 days
      (str) => (str ? +str : 30 * 24 * 60 * 60),
      z.number().int().positive().min(1)
    ),
    S_MAXAGE: z.preprocess(
      // If S_MAXAGE is not set, set it to 1 second
      (str) => (str ? +str : 1),
      // S_MAXAGE must be a positive integer
      z.number().int().positive().min(1)
    ),
    STALE_WHILE_REVALIDATE: z.preprocess(
      // If STALE_WHILE_REVALIDATE is not set, set it to 24 hours
      (str) => (str ? +str : 24 * 60 * 60),
      // STALE_WHILE_REVALIDATE must be a positive integer
      z.number().int().positive().min(1)
    ),
    SAMPLER_RATIO: z.preprocess(
      // If SAMPLER_RATIO is not set, set it to 1
      (str) => (str ? +str : 1),
      // SAMPLER_RATIO must be a positive number
      z.number().positive().min(0).max(1)
    ),
    GOOGLE_APPLICATION_CREDENTIALS: z.string().min(1),
    BUCKET_NAME: z.string().min(1),
    URL_EXPIRATION_TIME: z.preprocess(
      // If URL_EXPIRATION_TIME is not set, set it to 1 hour
      (str) => (str ? +str : 60 * 60 * 1000),
      // URL_EXPIRATION_TIME must be a positive integer
      z.number().int().positive().min(1)
    ),
    BUCKET_CORS_EXPIRATION_TIME: z.preprocess(
      // If BUCKET_CORS_EXPIRATION_TIME is not set, set it to 1 hour
      (str) => (str ? +str : 60 * 60),
      // BUCKET_CORS_EXPIRATION_TIME must be a positive integer
      z.number().int().positive().min(1)
    ),
    TYPING_TIMEOUT: z.preprocess(
      // If TYPING_TIMEOUT is not set, set it to 1000 ms
      (str) => (str ? +str : 1000),
      // TYPING_TIMEOUT must be a positive integer
      z.number().int().positive().min(1)
    ),
    // IF REDIS_URL is not set, will not using redis (memory cache)
    REDIS_URL: z.string().url(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
    NEXT_PUBLIC_WS_URL: z.string().url(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    SESSION_MAXAGE: process.env.SESSION_MAXAGE,
    S_MAXAGE: process.env.S_MAXAGE,
    STALE_WHILE_REVALIDATE: process.env.STALE_WHILE_REVALIDATE,
    SAMPLER_RATIO: process.env.SAMPLER_RATIO,
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    BUCKET_NAME: process.env.BUCKET_NAME,
    URL_EXPIRATION_TIME: process.env.URL_EXPIRATION_TIME,
    BUCKET_CORS_EXPIRATION_TIME: process.env.BUCKET_CORS_EXPIRATION_TIME,
    TYPING_TIMEOUT: process.env.TYPING_TIMEOUT,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    REDIS_URL: process.env.REDIS_URL,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
