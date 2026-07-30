import type { Metadata, Viewport } from "next";
import { Geist_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Fondo } from "@/components/Fondo";
import { ConfiguracionMovimiento } from "@/components/Motion";
import { BarraInferior, BarraSuperior } from "@/components/Navegacion";

const sans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mesa · liga de ping pong",
  description:
    "Ranking, historial y estadísticas de los partidos de ping pong entre amigos. Marcador en vivo y puntaje ELO.",
  applicationName: "Mesa",
  appleWebApp: { capable: true, title: "Mesa", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#131620",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${mono.variable} antialiased`}>
      <body className="min-h-dvh">
        <Fondo />
        <ConfiguracionMovimiento>
          <BarraSuperior />
          <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 md:px-8 md:pb-20 md:pt-10">
            {children}
          </main>
          <BarraInferior />
        </ConfiguracionMovimiento>
      </body>
    </html>
  );
}
