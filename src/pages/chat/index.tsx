import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Layout from "~/layout";
import { api } from "~/utils/api";

const ChatHome: NextPage = () => {
  useSession({ required: true });
  const availableUsers = api.message.availableUser.useQuery();

  return (
    <Layout title="Home">
      <div className="flex h-screen flex-col md:flex-row">
        <div className="flex w-full flex-col">
          {availableUsers.isLoading ? <p>Loading</p> : <></>}
          {availableUsers.data?.map((each, i) => {
            return (
              <Link href={`chat/${each.id}`} key={i}>
                Chat {each.nim}
              </Link>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default ChatHome;
