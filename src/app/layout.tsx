import type { Metadata, Viewport } from "next";
import { Anton, Archivo } from "next/font/google";
import "./globals.css";
import { AvisoAlmacenamiento } from "@/components/AvisoAlmacenamiento";
import { Fondo } from "@/components/Fondo";
import { ConfiguracionMovimiento } from "@/components/Motion";
import { BarraInferior, BarraSuperior } from "@/components/Navegacion";
import { PrimeraVez } from "@/components/PrimeraVez";

const display = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const sans = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ping Pong · la liga",
  description:
    "Quién le ganó a quién. Ranking, historial y estadísticas de los partidos de ping pong entre amigos.",
  applicationName: "Ping Pong",
  appleWebApp: { capable: true, title: "Ping Pong", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#1b2a63",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable} antialiased`}>
      <body className="min-h-dvh">
        <Fondo />
        <ConfiguracionMovimiento>
          <BarraSuperior />
          <main className="mx-auto w-full max-w-5xl px-4 pb-32 pt-6 md:px-8 md:pb-20 md:pt-10">
            {children}
          </main>
          <AvisoAlmacenamiento />
          <PrimeraVez />
          <BarraInferior />
        </ConfiguracionMovimiento>
      </body>
    </html>
  );
}
