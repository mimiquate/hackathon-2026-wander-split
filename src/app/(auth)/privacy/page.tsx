import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacidad — wonderSplit" };

export default function PrivacyPage() {
  return (
    <div className="flex w-full max-w-[560px] flex-col gap-[var(--space-6)]">
      <h1 className="m-0 font-display text-[length:var(--text-lg)] font-bold tracking-[-0.01em]">
        Política de privacidad
      </h1>
      <p className="m-0 text-[length:var(--text-sm)] leading-normal text-text-muted">
        Guardamos lo mínimo necesario para que wonderSplit funcione: tu correo, tu contraseña
        (nunca en texto plano — la guardamos con un hash irreversible) y los datos de los viajes
        que armás. No vendemos ni compartimos esa información con terceros.
      </p>
      <p className="m-0 text-[length:var(--text-sm)] leading-normal text-text-muted">
        Todavía estamos construyendo wonderSplit, así que esta política va a crecer junto con la
        app. Si tenés dudas, escribinos.
      </p>
    </div>
  );
}
