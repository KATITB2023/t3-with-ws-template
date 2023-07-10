import { Redis } from "~/server/redis";

const roomPrefix = "chat-user:";

const getKey = (userId: string) => {
  return `${roomPrefix}${userId}`;
};

export async function getUserSockets(userId: string) {
  const redis = await Redis.getClient();
  return await redis.sMembers(getKey(userId));
}

export async function addUserSockets(userId: string, socketId: string) {
  const redis = await Redis.getClient();
  await redis.sAdd(getKey(userId), socketId);
}

export async function removeUserSockets(userId: string, socketId: string) {
  const redis = await Redis.getClient();
  await redis.sRem(getKey(userId), socketId);
}
