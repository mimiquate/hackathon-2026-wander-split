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
    body: "Quién pagó, quién usó qué, el cambio real que uso tu banco y el mínimo de transferencias.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="scroll-mt-20 border-t border-border bg-surface px-10 py-[var(--section-gap)]"
    >
      <div className="mx-auto max-w-[var(--page-max)]">
        <h2 className="font-display text-[length:var(--text-lg)] font-semibold">
          Cómo funciona
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.title}>
              <span className="flex h-tap-min w-tap-min items-center justify-center rounded-xl bg-surface-2 text-primary">
                <Icon name={step.icon} size={22} />
              </span>
              <div className="mt-3 font-display text-[1.05rem] font-bold">
                {step.title}
              </div>
              <p className="mt-1 max-w-[32ch] text-[length:var(--text-sm)] text-text-muted">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
