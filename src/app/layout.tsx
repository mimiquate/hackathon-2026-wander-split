import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "wonderSplit",
  description: "Armá la ruta juntos, dividí los gastos sin drama.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <head>
        {/* Same CDN source as tokens/fonts.css; loaded as a <link> rather than
            a CSS @import — see the note in src/styles/tokens.css. The
            no-page-custom-font rule targets the Pages Router's
            pages/_document.js; there's no equivalent concern in the App
            Router, where this root layout already is the single shared shell. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Karla:ital,wght@0,400;0,500;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
