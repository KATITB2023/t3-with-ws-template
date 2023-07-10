import { type Message } from "@prisma/client";
import { type NextPage } from "next";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import AddMessageForm from "~/components/AddMessageForm";
import useSubscription from "~/hooks/useSubscription";
import Layout from "~/layout";
import { api } from "~/utils/api";

const Chat: NextPage = () => {
  const router = useRouter();
  const { data: session } = useSession({ required: true });
  const pairId = router.query.pairId as string;
  const userPair = api.message.getUser.useQuery({ pairId }).data;

  const messageQuery = api.message.infinite.useInfiniteQuery(
    { pairId },
    {
      getPreviousPageParam: (d) => d.prevCursor,
    }
  );

  const { hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage } =
    messageQuery;

  // List of messages that are rendered
  const [messages, setMessages] = useState(() => {
    const msgs = messageQuery.data?.pages.map((page) => page.items).flat();
    return msgs;
  });

  // Function to add and dedupe new messages onto state
  const addMessages = useCallback((incoming?: Message[]) => {
    setMessages((current) => {
      const map: Record<Message["id"], Message> = {};
      for (const msg of current ?? []) map[msg.id] = msg;

      for (const msg of incoming ?? []) map[msg.id] = msg;

      return Object.values(map).sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
    });
  }, []);

  // When new data from `useInfiniteQuery`, merge with current state
  useEffect(() => {
    const msgs = messageQuery.data?.pages.map((page) => page.items).flat();
    addMessages(msgs);
  }, [messageQuery.data?.pages, addMessages]);

  // HTML element that is scrolled to when new messages are added
  const scrollTargetRef = useRef<HTMLDivElement>(null);

  const scrollToBottomOfList = useCallback(() => {
    if (scrollTargetRef.current == null) return;

    scrollTargetRef.current.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [scrollTargetRef]);

  useEffect(() => {
    scrollToBottomOfList();
  }, [scrollToBottomOfList]);

  // Subscribe to new posts and add
  useSubscription("add", (post) => {
    if (
      post.receiverId === session?.user.id ||
      post.senderId === session?.user.id
    ) {
      addMessages([post]);
    }
  });

  // Currently typing state
  const [currentlyTyping, setCurrentlyTyping] = useState<string[]>([]);

  useSubscription("whoIsTyping", (data) => {
    setCurrentlyTyping(data);
  });

  return (
    <Layout title="Chat">
      <div className="flex h-screen flex-col md:flex-row">
        <section className="flex w-full flex-col bg-gray-800 md:w-72">
          <div className="flex-1 overflow-y-hidden">
            <div className="flex h-full flex-col divide-y divide-gray-700">
              <header className="p-4">
                <h1 className="text-3xl font-bold text-gray-50">
                  tRPC WebSocket starter
                </h1>
                <p className="text-sm text-gray-400">
                  Showcases WebSocket + subscription support
                  <br />
                  <a
                    className="text-gray-100 underline"
                    href="https://github.com/trpc/examples-next-prisma-starter-websockets"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Source on GitHub
                  </a>
                </p>
              </header>
              <div className="hidden flex-1 space-y-6 overflow-y-auto p-4 text-gray-400 md:block">
                <article className="space-y-2">
                  <h2 className="text-lg text-gray-200">Introduction</h2>
                  <ul className="list-inside list-disc space-y-2">
                    <li>Open inspector and head to Network tab</li>
                    <li>All client requests are handled through WebSockets</li>
                    <li>
                      We have a simple backend subscription on new messages that
                      adds the newly added message to the current state
                    </li>
                  </ul>
                </article>
                {session && (
                  <article>
                    <h2 className="text-lg text-gray-200">User information</h2>
                    <ul className="space-y-2">
                      <li className="text-lg">
                        You&apos;re{" "}
                        <input
                          id="name"
                          name="name"
                          type="text"
                          disabled
                          className="bg-transparent"
                          value={session.user.id}
                        />
                      </li>
                      <li>
                        <button onClick={() => void signOut()}>Sign Out</button>
                      </li>
                    </ul>
                  </article>
                )}
              </div>
            </div>
          </div>
          <div className="hidden h-16 shrink-0 md:block"></div>
        </section>
        <div className="flex-1 overflow-y-hidden md:h-screen">
          <section className="flex h-full flex-col justify-end space-y-4 bg-gray-700 p-4">
            <div className="space-y-4 overflow-y-auto">
              <button
                data-testid="loadMore"
                onClick={() => void fetchPreviousPage()}
                disabled={!hasPreviousPage || isFetchingPreviousPage}
                className="rounded bg-indigo-500 px-4 py-2 text-white disabled:opacity-40"
              >
                {isFetchingPreviousPage
                  ? "Loading more..."
                  : hasPreviousPage
                  ? "Load More"
                  : "Nothing more to load"}
              </button>
              <div className="space-y-4">
                {messages?.map((item) => (
                  <article key={item.id} className=" text-gray-50">
                    <header className="flex space-x-2 text-sm">
                      <h3 className="text-base">
                        {item.senderId === userPair?.id
                          ? userPair.nim
                          : session?.user.name ?? "Me"}
                      </h3>
                      <span className="text-gray-500">
                        {new Intl.DateTimeFormat("en-GB", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(item.createdAt)}
                      </span>
                    </header>
                    <p className="whitespace-pre-line text-xl leading-tight">
                      {item.message}
                    </p>
                  </article>
                ))}
                <div ref={scrollTargetRef}></div>
              </div>
            </div>
            <div className="w-full">
              <AddMessageForm onMessagePost={() => scrollToBottomOfList()} />
              <p className="h-2 italic text-gray-400">
                {currentlyTyping.length
                  ? `${currentlyTyping.join(", ")} typing...`
                  : ""}
              </p>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
