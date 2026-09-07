import { prisma } from "@/lib/prisma";

export const MAX_LOGIN_FAILURES = 5;
export const LOGIN_WINDOW_MS = 5 * 60_000;

export async function countRecentFailures(userId: string): Promise<number> {
  return prisma.loginAttempt.count({
    where: {
      userId,
      succeeded: false,
      createdAt: { gte: new Date(Date.now() - LOGIN_WINDOW_MS) },
    },
  });
}

export async function recordLoginAttempt(userId: string, succeeded: boolean): Promise<void> {
  await prisma.loginAttempt.create({ data: { userId, succeeded } });
}
