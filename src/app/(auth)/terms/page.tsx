import type { Metadata } from "next";

export const metadata: Metadata = { title: "Términos — wonderSplit" };

export default function TermsPage() {
  return (
    <div className="flex w-full max-w-[560px] flex-col gap-[var(--space-6)]">
      <h1 className="m-0 font-display text-[length:var(--text-lg)] font-bold tracking-[-0.01em]">
        Términos y condiciones
      </h1>
      <p className="m-0 text-[length:var(--text-sm)] leading-normal text-text-muted">
        wonderSplit es una herramienta para armar viajes en grupo y repartir los gastos entre
        quienes participan. Al crear una cuenta, aceptás usarla de buena fe: la información que
        cargues (rutas, gastos, comprobantes) es tuya y del grupo con el que viajás, y nosotros
        solo la usamos para que la app funcione.
      </p>
      <p className="m-0 text-[length:var(--text-sm)] leading-normal text-text-muted">
        Todavía estamos construyendo wonderSplit, así que estos términos van a crecer junto con la
        app. Si tenés dudas, escribinos.
      </p>
    </div>
  );
}
