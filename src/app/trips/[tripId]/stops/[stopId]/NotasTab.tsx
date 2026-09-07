"use client";

import { useState } from "react";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/forms";
import { Avatar } from "@/components/trip/Avatar";
import { formatRelativeTime } from "@/lib/trips/dates";
import { addNoteAction, type TripNoteView } from "./actions";

export interface NotasTabProps {
  tripId: string;
  stopId: string;
  cityName: string;
  notes: TripNoteView[];
  onAdded: (note: TripNoteView) => void;
}

/** #23 — the group's free-text notes board for this stop's city. */
export function NotasTab({ tripId, stopId, cityName, notes, onAdded }: NotasTabProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleSend() {
    const trimmed = text.trim();
    // Matches the design's own guard (`if (!t) return`) — no error shown,
    // just nothing happens.
    if (!trimmed || sending) return;

    setSending(true);
    setError(undefined);

    const result = await addNoteAction(tripId, stopId, trimmed);
    if (!result.ok) {
      setError(result.formError ?? result.fieldErrors?.text);
      setSending(false);
      return;
    }

    onAdded(result.note);
    setText("");
    setSending(false);
  }

  return (
    <div className="flex flex-col gap-[var(--space-5)] rounded-2xl bg-surface-2 p-[var(--space-5)]">
      <h2 className="m-0 text-[length:var(--text-base)] font-bold text-text">Notas del grupo</h2>

      {notes.length === 0 ? (
        <p className="m-0 text-center text-[length:var(--text-sm)] text-text-muted">
          Todavía no hay notas para {cityName}.
        </p>
      ) : (
        <ul className="flex list-none flex-col gap-[var(--space-4)] p-0">
          {notes.map((note) => (
            <li key={note.id} className="flex items-start gap-[var(--space-3)]">
              <Avatar name={note.author.displayName} colorIndex={note.author.colorIndex} size="sm" />
              <div className="flex min-w-0 flex-col gap-[var(--space-1)]">
                <p className="m-0 text-[length:var(--text-sm)] text-text">{note.text}</p>
                <span className="text-[length:var(--text-xs)] text-text-muted">
                  {note.author.displayName} · {formatRelativeTime(new Date(note.createdAt))}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-[var(--space-3)]">
        <div className="min-w-0 flex-1">
          <Input
            placeholder="Escribí algo para el grupo"
            value={text}
            onChange={(e) => setText(e.target.value)}
            error={error}
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>
        <Button type="button" onClick={handleSend} disabled={sending || !text.trim()}>
          {sending ? "Mandando…" : "Mandar"}
        </Button>
      </div>
    </div>
  );
}
