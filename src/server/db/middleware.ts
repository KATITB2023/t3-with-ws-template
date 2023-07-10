/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { type Message, type Prisma, type User } from "@prisma/client";

export const softDeleteChangeFind: Prisma.Middleware<User | Message> = async (
  params,
  next
) => {
  if (!params.args) params.args = {};

  if (
    params.action === "findUnique" ||
    params.action === "findFirst" ||
    params.action === "findMany"
  ) {
    // Add 'isDeleted' filter
    // ID filter maintained
    if (params.args.where !== undefined) {
      if (params.args.where.isDeleted === undefined) {
        // Exclude isDeleted records if they have not been explicitly requested
        params.args.where["isDeleted"] = false;
      }
    } else {
      params.args["where"] = { isDeleted: false };
    }
  }

  return await next(params);
};

export const softDeleteChangeUpdate: Prisma.Middleware<User | Message> = async (
  params,
  next
) => {
  if (!params.args) params.args = {};

  if (
    params.action === "update" ||
    params.action === "updateMany" ||
    params.action === "upsert"
  ) {
    // Add 'isDeleted' filter
    // ID filter maintained
    if (params.args.where !== undefined) {
      params.args.where["isDeleted"] = false;
    } else {
      params.args["where"] = { isDeleted: false };
    }
  }

  return await next(params);
};

export const softDeleteChangeDelete: Prisma.Middleware<User | Message> = async (
  params,
  next
) => {
  if (!params.args) params.args = {};

  if (params.action === "delete" || params.action === "deleteMany") {
    if (params.action === "delete") {
      // Change to updateMany - you cannot filter
      // by anything except ID / unique with findUnique
      params.action = "update";
    } else {
      // Delete many queries
      params.action = "updateMany";
    }

    // Add 'isDeleted' filter
    // ID filter maintained
    if (params.args.where !== undefined) {
      params.args.where["isDeleted"] = false;
    } else {
      params.args["where"] = { isDeleted: false };
    }

    // Set isDeleted to true
    if (params.args.data !== undefined) {
      params.args.data["isDeleted"] = true;
    } else {
      params.args["data"] = { isDeleted: true };
    }
  }

  return await next(params);
};

export const versioningChangeUpdate: Prisma.Middleware<User | Message> = async (
  params,
  next
) => {
  if (!params.args) params.args = {};

  if (
    params.action === "update" ||
    params.action === "updateMany" ||
    params.action === "upsert"
  ) {
    // Increment version
    if (params.args.data !== undefined) {
      params.args.data["version"] = { increment: 1 };
    } else {
      params.args["data"] = { version: { increment: 1 } };
    }
  }

  return await next(params);
};
