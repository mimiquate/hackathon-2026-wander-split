import { Button } from "@/components/core";

// Copy reused verbatim from the hero — the design source has no dedicated
// final-CTA copy of its own (confirmed against Landing.jsx, the Ruta
// Terracota one-pager, and the voice guidelines), and reusing the hero's
// already-established button label and reassurance line avoids inventing
// new marketing copy.
export function FinalCta() {
  return (
    <section
      id="precios"
      className="scroll-mt-20 border-t border-border px-10 py-[var(--section-gap)]"
    >
      <div className="mx-auto flex max-w-[var(--page-max)] flex-col items-center gap-4 text-center">
        <Button size="lg" iconRight="arrow-right">
          Armar un viaje
        </Button>
        <p className="text-[length:var(--text-sm)] text-text-muted">
          Menos planillas, menos “¿quién me debía?”, más viaje.
        </p>
      </div>
    </section>
  );
}
