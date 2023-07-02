import { parseArgs } from "node:util";
import path from "path";
import fs from "fs";
import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcrypt";
import { parse } from "csv-parse";

const prisma = new PrismaClient();

interface RawCSVData {
  userId: string;
  text: string;
}

async function main() {
  const {
    values: { environment },
  } = parseArgs({
    options: {
      environment: { type: "string" },
    },
  });

  switch (environment) {
    case "development":
      /** Data for your development */
      const user = await prisma.user.create({
        data: {
          nim: "13520065",
          passwordHash: await hash("password", 10),
          role: UserRole.ADMIN,
        },
      });
      console.log(user);
      break;
    case "production":
      /** Data for your test environment */
      const csvFilePath = path.resolve(__dirname, "data/examples.csv");
      const fileContent = fs.readFileSync(csvFilePath, { encoding: "utf-8" });

      parse(
        fileContent,
        {
          delimiter: ",",
          columns: Object.keys({
            userId: new String(),
            text: new String(),
          } as RawCSVData),
        },
        async (err, records: RawCSVData[]) => {
          if (err) console.error(err);

          const posts = await Promise.all(
            records.map(async (record) => {
              return await prisma.post.create({
                data: {
                  userId: record.userId,
                  text: record.text,
                },
              });
            })
          );

          console.log(posts);
        }
      );
      break;
    default:
      break;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
