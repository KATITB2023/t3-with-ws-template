import { z } from "zod";
import { createEvent } from "~/server/socket/helper";
import { currentlyTyping } from "~/server/socket/state";

export const postEvent = createEvent(
  {
    name: "post",
    input: z.object({ text: z.string().min(1) }),
    authRequired: true,
  },
  async ({ ctx, input }) => {
    const post = await ctx.prisma.post.create({
      data: {
        userId: ctx.client.data.session.user.id,
        text: input.text,
      },
    });

    ctx.io.emit("add", post);

    delete currentlyTyping[ctx.client.data.session.user.id];

    ctx.io.emit("whoIsTyping", Object.keys(currentlyTyping));

    return post;
  }
);

export const isTypingEvent = createEvent(
  {
    name: "isTyping",
    input: z.object({ typing: z.boolean() }),
    authRequired: true,
  },
  ({ ctx, input }) => {
    if (!input.typing) {
      delete currentlyTyping[ctx.client.data.session.user.id];
    } else {
      currentlyTyping[ctx.client.data.session.user.id] = {
        lastTyped: new Date(),
      };
    }

    ctx.io.emit("whoIsTyping", Object.keys(currentlyTyping));
  }
);
