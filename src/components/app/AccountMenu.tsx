"use client";

import Link from "next/link";
import type { User } from "@prisma/client";
import { Avatar } from "@/components/trip/Avatar";
import { signOutAction } from "@/app/(app)/actions";

export interface AccountMenuProps {
  user: User;
}

export function AccountMenu({ user }: AccountMenuProps) {
  return (
    <details className="group relative">
      <summary className="cursor-pointer list-none">
        <Avatar
          name={user.name || user.email}
          colorIndex={user.avatarColorIndex ?? 0}
          size="md"
        />
      </summary>
      <div className="absolute right-0 top-full mt-[var(--space-2)] w-48 rounded-lg border border-border bg-surface shadow-lg">
        <div className="flex flex-col p-[var(--space-2)]">
          <span className="px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-sm)] font-medium text-text-muted opacity-50">
            Mi perfil
          </span>
          <span className="px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-sm)] font-medium text-text-muted opacity-50">
            Dispositivos y sesiones
          </span>
          <hr className="my-[var(--space-1)] border-border" />
          <Link
            href="/forgot"
            className="block px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-sm)] font-medium text-text hover:bg-surface-hover rounded"
          >
            Cambiar contraseña
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full text-left px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-sm)] font-medium text-text hover:bg-surface-hover rounded"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </details>
  );
}
