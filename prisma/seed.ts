import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/password";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const email = "dev@wondersplit.test";
  const password = "password123";

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash: await hashPassword(password) },
  });

  console.log(`Seeded dev user: ${user.email} / ${password}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
