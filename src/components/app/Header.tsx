import Image from "next/image";
import type { User } from "@prisma/client";
import { AccountMenu } from "./AccountMenu";

export interface HeaderProps {
  user: User;
}

export async function Header({ user }: HeaderProps) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-[var(--space-4)] py-[var(--space-4)]">
        <div className="flex items-center gap-[var(--space-4)]">
          <Image src="/route-mark-dark.svg" alt="" width={32} height={20} />
          <span className="font-display text-[0.95rem] font-bold tracking-[-0.01em]">
            wonderSplit
          </span>
        </div>
        <AccountMenu user={user} />
      </div>
    </header>
  );
}
