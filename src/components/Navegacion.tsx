"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { IconoHistorial, IconoJugadores, IconoPaleta, IconoPodio } from "./Iconos";
import { useLiga } from "@/lib/store";

const RUTAS = [
  { href: "/", texto: "Ranking", Icono: IconoPodio },
  { href: "/partido", texto: "Partido", Icono: IconoPaleta },
  { href: "/historial", texto: "Historial", Icono: IconoHistorial },
  { href: "/jugadores", texto: "Jugadores", Icono: IconoJugadores },
] as const;

function esActiva(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function LogoMesa({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 22 22" className={className} fill="none" aria-hidden>
      <rect
        x="1.6"
        y="7.4"
        width="18.8"
        height="12"
        rx="1.8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M11 7.4v12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2.4" />
      <circle cx="16.2" cy="4.2" r="2.6" fill="var(--color-pelota)" />
    </svg>
  );
}

export function BarraSuperior() {
  const pathname = usePathname();
  const { liga, hidratado } = useLiga();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--borde)] bg-mesa-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-4 md:h-16 md:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <LogoMesa className="size-5 text-tiza-45 transition-colors duration-200 group-hover:text-tiza-70" />
          <span className="text-sm font-semibold uppercase tracking-[0.16em] text-tiza">Mesa</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {RUTAS.map(({ href, texto }) => {
            const activa = esActiva(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-3 py-2 text-sm transition-colors duration-[120ms] ${
                  activa ? "text-tiza" : "text-tiza-45 hover:text-tiza-70"
                }`}
              >
                {texto}
                {activa ? (
                  <motion.span
                    layoutId="subrayado-nav"
                    className="absolute inset-x-3 -bottom-px h-px bg-pelota"
                    transition={{ type: "spring", stiffness: 480, damping: 40 }}
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          {hidratado && liga.totalPartidos > 0 ? (
            <span className="hidden font-mono text-2xs uppercase tracking-[0.14em] text-tiza-25 sm:block">
              {liga.totalPartidos} partidos · {liga.tabla.length} en juego
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function BarraInferior() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--borde)] bg-mesa-900/92 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {RUTAS.map(({ href, texto, Icono }) => {
          const activa = esActiva(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={activa ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center gap-1.5 rounded-sm py-2"
            >
              {activa ? (
                <motion.span
                  layoutId="pastilla-nav"
                  className="absolute inset-x-1 inset-y-0 rounded-sm bg-mesa-800"
                  transition={{ type: "spring", stiffness: 520, damping: 44 }}
                />
              ) : null}
              <Icono
                className={`relative size-[22px] transition-colors duration-[120ms] ${
                  activa ? "text-pelota" : "text-tiza-25"
                }`}
              />
              <span
                className={`relative text-[10px] tracking-wide transition-colors duration-[120ms] ${
                  activa ? "text-tiza" : "text-tiza-25"
                }`}
              >
                {texto}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
