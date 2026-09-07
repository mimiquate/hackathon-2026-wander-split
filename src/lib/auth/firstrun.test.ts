// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { completeFirstRun } from "@/lib/auth/firstrun";

describe("firstrun", () => {
  let userId: string;
  let email: string;

  beforeEach(async () => {
    email = `test-${randomUUID()}@example.com`;
    const user = await prisma.user.create({
      data: { email, passwordHash: await hashPassword("irrelevant") },
    });
    userId = user.id;
  });

  afterEach(async () => {
    await prisma.user.delete({ where: { id: userId } });
  });

  it("stamps firstRunCompletedAt and updates name/color when both are given", async () => {
    await completeFirstRun({ userId, name: "Nueva", avatarColorIndex: 3 });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.firstRunCompletedAt).not.toBeNull();
    expect(user.name).toEqual("Nueva");
    expect(user.avatarColorIndex).toEqual(3);
  });

  it("stamps firstRunCompletedAt but leaves name/color untouched on skip", async () => {
    await completeFirstRun({ userId });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.firstRunCompletedAt).not.toBeNull();
    expect(user.name).toBeNull();
    expect(user.avatarColorIndex).toBeNull();
  });

  it("doesn't reset the flag when called twice", async () => {
    const first = await completeFirstRun({ userId, name: "First" });
    const user1 = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const ts1 = user1.firstRunCompletedAt!.getTime();

    await new Promise((resolve) => setTimeout(resolve, 10));
    await completeFirstRun({ userId, name: "Second" });
    const user2 = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const ts2 = user2.firstRunCompletedAt!.getTime();

    expect(ts2).toBeGreaterThanOrEqual(ts1);
  });
});
