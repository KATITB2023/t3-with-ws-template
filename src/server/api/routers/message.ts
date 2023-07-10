import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const messageRouter = createTRPCRouter({
  infinite: protectedProcedure
    .input(
      z.object({
        cursor: z.date().optional(),
        take: z.number().min(1).max(50).default(10),
        pairId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const page = await ctx.prisma.message.findMany({
        orderBy: {
          createdAt: "desc",
        },
        cursor: input.cursor ? { createdAt: input.cursor } : undefined,
        take: input.take + 1,
        skip: 0,
        where: {
          OR: [
            {
              AND: {
                receiverId: input.pairId,
                senderId: ctx.session.user.id,
              },
            },
            {
              AND: {
                receiverId: ctx.session.user.id,
                senderId: input.pairId,
              },
            },
          ],
        },
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
  getUser: protectedProcedure
    .input(
      z.object({
        pairId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.user.findFirstOrThrow({
        where: {
          id: input.pairId,
        },
        select: {
          nim: true,
          id: true,
        },
      });
    }),
  availableUser: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.user.findMany({
      where: {
        id: {
          not: ctx.session !== null ? ctx.session.user.id : undefined,
        },
      },
      select: {
        id: true,
        nim: true,
      },
    });
  }),
});
