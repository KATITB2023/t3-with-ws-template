import { type Post } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  add: protectedProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          nim: true,
        },
      });

      if (!user)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });

      const post = await ctx.prisma.post.create({
        data: {
          userId: ctx.session.user.id,
          text: input.text,
        },
      });

      ctx.eventEmitter.emit("add", post);

      delete ctx.currentlyTyping[user.nim];

      ctx.eventEmitter.emit("isTypingUpdate");

      return post;
    }),

  isTyping: protectedProcedure
    .input(z.object({ typing: z.boolean() }))
    .mutation(({ ctx, input }) => {
      if (!input.typing) {
        delete ctx.currentlyTyping[ctx.session.user.id];
      } else {
        ctx.currentlyTyping[ctx.session.user.id] = {
          lastTyped: new Date(),
        };
      }

      ctx.eventEmitter.emit("isTypingUpdate");
    }),

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

  onAdd: publicProcedure.subscription(({ ctx }) => {
    return observable<Post>((emit) => {
      const onAdd = (data: Post) => {
        emit.next(data);
      };

      ctx.eventEmitter.on("add", onAdd);

      return () => {
        ctx.eventEmitter.off("add", onAdd);
      };
    });
  }),

  whoIsTyping: publicProcedure.subscription(({ ctx }) => {
    let prev: string[] = [];

    return observable<string[]>((emit) => {
      const onIsTypingUpdate = () => {
        const newData = Object.keys(ctx.currentlyTyping);

        if (prev.toString() !== newData.toString()) emit.next(newData);

        prev = newData;
      };

      ctx.eventEmitter.on("isTypingUpdate", onIsTypingUpdate);

      return () => {
        ctx.eventEmitter.off("isTypingUpdate", onIsTypingUpdate);
      };
    });
  }),
});
