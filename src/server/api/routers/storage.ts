import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import sanitize from "sanitize-filename";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { AllowableFileTypeEnum, FolderEnum } from "~/utils/file";
import { env } from "~/env.cjs";

export const storageRouter = createTRPCRouter({
  generateURLForDownload: publicProcedure
    .input(
      z.object({
        folder: z.nativeEnum(FolderEnum),
        filename: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Cukup panggil di awal saja
      await ctx.bucket.setCorsConfiguration([
        {
          maxAgeSeconds: env.BUCKET_CORS_EXPIRATION_TIME,
          method: ["GET", "PUT", "DELETE"],
          origin: ["*"],
          responseHeader: ["Content-Type"],
        },
      ]);

      const ref = ctx.bucket.file(`${input.folder}/${input.filename}`);

      const [url] = await ref.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + env.URL_EXPIRATION_TIME,
      });

      return {
        url,
      };
    }),

  generateURLForUpload: protectedProcedure
    .input(
      z.object({
        folder: z.nativeEnum(FolderEnum),
        filename: z.string(),
        contentType: z.nativeEnum(AllowableFileTypeEnum),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const fileUUID = uuidv4();
      const sanitizedFileName = sanitize(input.filename);
      const sanitizedFilename = `${fileUUID}-${sanitizedFileName}`;

      // TODO: Cukup panggil di awal saja
      await ctx.bucket.setCorsConfiguration([
        {
          maxAgeSeconds: env.BUCKET_CORS_EXPIRATION_TIME,
          method: ["GET", "PUT", "DELETE"],
          origin: ["*"],
          responseHeader: ["Content-Type"],
        },
      ]);

      const ref = ctx.bucket.file(`${input.folder}/${sanitizedFilename}`);

      const [url] = await ref.getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + env.URL_EXPIRATION_TIME,
        contentType: input.contentType,
      });

      return {
        url,
        sanitizedFilename,
      };
    }),

  generateURLForDelete: protectedProcedure
    .input(
      z.object({
        folder: z.nativeEnum(FolderEnum),
        filename: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Cukup panggil di awal saja
      await ctx.bucket.setCorsConfiguration([
        {
          maxAgeSeconds: env.BUCKET_CORS_EXPIRATION_TIME,
          method: ["GET", "PUT", "DELETE"],
          origin: ["*"],
          responseHeader: ["Content-Type"],
        },
      ]);

      const ref = ctx.bucket.file(`${input.folder}/${input.filename}`);

      const [url] = await ref.getSignedUrl({
        version: "v4",
        action: "delete",
        expires: Date.now() + env.URL_EXPIRATION_TIME,
      });

      return {
        url,
      };
    }),
});
