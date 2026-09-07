import type { ReactNode } from "react";
import Image from "next/image";
import { Card } from "@/components/core/Card";

export interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
}

/** The centered wordmark + card shell shared by every auth-flow screen. */
export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <div className="flex w-full max-w-[420px] flex-col gap-[var(--space-7)] motion-safe:animate-[ws-rise_var(--dur-enter)_var(--ease-out)_both]">
      <div className="flex items-center gap-[var(--space-4)]">
        <Image src="/route-mark-dark.svg" alt="" width={56} height={34} priority />
        <span className="font-display text-[1.15rem] font-bold tracking-[-0.01em] text-text">
          wonderSplit
        </span>
      </div>
      <Card padding="lg" className="flex flex-col gap-[var(--space-6)]">
        <div className="flex flex-col gap-[var(--space-2)]">
          <span className="font-mono text-[length:var(--text-eyebrow)] tracking-[var(--tracking-eyebrow)] uppercase text-text-muted">
            {eyebrow}
          </span>
          <h1 className="m-0 text-balance font-display text-[length:var(--text-lg)] font-bold tracking-[-0.01em]">
            {title}
          </h1>
          <p className="m-0 text-[length:var(--text-sm)] leading-normal text-text-muted">
            {description}
          </p>
        </div>
        {children}
      </Card>
    </div>
  );
}
