import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  infinite: publicProcedure
    .input(
      z.object({
        cursor: z.date().optional(),
        take: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const page = await ctx.prisma.post.findMany({
        orderBy: {
          createdAt: "desc",
        },
        cursor: input.cursor ? { createdAt: input.cursor } : undefined,
        take: input.take + 1,
        skip: 0,
      });

      const items = page.reverse();
      let prevCursor: typeof input.cursor = undefined;

      if (items.length > input.take) {
        const prev = items.shift();
        prevCursor = prev?.createdAt;
      }

      return {
        items,
        prevCursor,
      };
    }),
});
