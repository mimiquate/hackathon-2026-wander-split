import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      data-theme="dark"
      className="flex min-h-screen items-center justify-center bg-bg px-[var(--space-8)] py-[var(--space-10)] font-body text-text"
    >
      {children}
    </div>
  );
}
