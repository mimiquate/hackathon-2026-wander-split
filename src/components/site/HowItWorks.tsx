import { Icon } from "@/components/core";

const STEPS = [
  {
    icon: "map",
    title: "Armen la ruta juntos",
    body: "Ciudades, fechas y noches en un mapa que cualquiera del grupo puede editar.",
  },
  {
    icon: "ticket",
    title: "Todo en un solo lugar",
    body: "Reservas, vouchers y códigos, con el estado de cada cosa a la vista.",
  },
  {
    icon: "scale",
    title: "La cuenta la hacemos nosotros",
    body: "Quién pagó, quién usó qué, el cambio real que leemos de tu resumen bancario y el mínimo de transferencias.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="scroll-mt-20 border-t border-border"
    >
      <div className="mx-auto max-w-[var(--page-max)] px-[var(--gutter)] py-[var(--section-gap)]">
        <h2 className="font-display text-[length:var(--text-lg)] font-semibold leading-[var(--leading-snug)]">
          Cómo funciona
        </h2>
        <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.title}>
              <span className="flex h-tap-min w-tap-min items-center justify-center rounded-xl bg-surface-2 text-primary">
                <Icon name={step.icon} size={22} />
              </span>
              <div className="mt-[14px] font-display text-[length:var(--text-md)] font-bold">
                {step.title}
              </div>
              <p className="mt-[6px] max-w-[34ch] text-pretty text-[length:var(--text-sm)] text-text-muted">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
