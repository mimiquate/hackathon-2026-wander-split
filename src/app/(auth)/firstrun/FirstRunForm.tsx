"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/forms";
import { AvatarColorPicker } from "@/components/auth/AvatarColorPicker";
import { saveFirstRunAction, skipFirstRunAction, type FirstRunFormState } from "./actions";

const INITIAL_STATE: FirstRunFormState = {};

export function FirstRunForm({ currentName }: { currentName: string | null }) {
  const [saveState, saveSubmit, savePending] = useActionState(saveFirstRunAction, INITIAL_STATE);
  const [, skipSubmit, skipPending] = useActionState(skipFirstRunAction, INITIAL_STATE);
  const [colorIndex, setColorIndex] = useState(0);

  const pending = savePending || skipPending;

  return (
    <form action={saveSubmit} className="flex flex-col gap-[var(--space-6)]">
      <Input
        label="Tu nombre"
        name="name"
        placeholder="Como querés que te vean"
        defaultValue={currentName ?? ""}
        disabled={pending}
      />
      <AvatarColorPicker
        name="avatarColorIndex"
        value={colorIndex}
        onChange={setColorIndex}
        disabled={pending}
      />
      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {savePending ? "Guardando…" : "Guardar"}
      </Button>
      <button
        type="submit"
        formAction={skipSubmit}
        disabled={pending}
        className="font-medium text-text-muted underline underline-offset-[3px] disabled:opacity-50"
      >
        {skipPending ? "Un momento…" : "Después"}
      </button>
    </form>
  );
}
