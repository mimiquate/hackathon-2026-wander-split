import type { ReactNode } from "react";
import { Icon } from "@/components/core/Icon";

export interface AlertBannerProps {
  icon: string;
  children: ReactNode;
}

/** A rate-limit / form-level error banner — ocre-tinted, icon plus message. */
export function AlertBanner({ icon, children }: AlertBannerProps) {
  return (
    <div className="flex items-start gap-[var(--space-3)] rounded-lg bg-[color-mix(in_oklab,var(--alert)_18%,transparent)] p-[var(--space-4)] text-[length:var(--text-sm)] leading-normal text-text">
      <span className="flex pt-0.5 text-alert">
        <Icon name={icon} size={16} />
      </span>
      <span>{children}</span>
    </div>
  );
}
