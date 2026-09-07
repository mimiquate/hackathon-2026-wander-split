import { prisma } from "@/lib/prisma";

export interface CompleteFirstRunInput {
  userId: string;
  name?: string;
  avatarColorIndex?: number;
}

export async function completeFirstRun({
  userId,
  name,
  avatarColorIndex,
}: CompleteFirstRunInput): Promise<void> {
  const data: { name?: string; avatarColorIndex?: number; firstRunCompletedAt: Date } = {
    firstRunCompletedAt: new Date(),
  };
  if (name) data.name = name;
  if (avatarColorIndex !== undefined) data.avatarColorIndex = avatarColorIndex;

  await prisma.user.update({
    where: { id: userId },
    data,
  });
}
