"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { IconoHistorial, IconoJugadores, IconoMas, IconoPodio } from "./Iconos";
import { useLiga } from "@/lib/store";

const RUTAS = [
  { href: "/", texto: "Ranking", Icono: IconoPodio },
  { href: "/cargar", texto: "Cargar", Icono: IconoMas },
  { href: "/historial", texto: "Historial", Icono: IconoHistorial },
  { href: "/jugadores", texto: "Jugadores", Icono: IconoJugadores },
] as const;

function esActiva(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function LogoMesa({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 26 26" className={className} fill="none" aria-hidden>
      <rect
        x="2"
        y="8.5"
        width="22"
        height="14"
        rx="2"
        fill="var(--color-azul-700)"
        stroke="var(--color-tinta)"
        strokeWidth="2.5"
      />
      <path d="M13 8.5v14" stroke="var(--color-tinta)" strokeWidth="2.5" strokeDasharray="2.5 2.5" />
      <circle
        cx="19"
        cy="4.5"
        r="3.4"
        fill="var(--color-naranja)"
        stroke="var(--color-tinta)"
        strokeWidth="2.5"
      />
    </svg>
  );
}

export function BarraSuperior() {
  const pathname = usePathname();
  const { liga, hidratado } = useLiga();

  return (
    <header className="sticky top-0 z-30 border-b-[3px] border-tinta bg-azul-950/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-6 px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMesa className="size-7" />
          <span className="display text-2xl text-crema">Mesa</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {RUTAS.map(({ href, texto }) => {
            const activa = esActiva(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-3 py-2 text-2xs font-bold uppercase tracking-[0.14em] transition-colors duration-100 ${
                  activa ? "text-tinta" : "text-crema/60 hover:text-crema"
                }`}
              >
                {activa ? (
                  <motion.span
                    layoutId="pastilla-nav-escritorio"
                    className="absolute inset-0 -rotate-1 rounded-sm border-2 border-tinta bg-naranja"
                    transition={{ type: "spring", stiffness: 480, damping: 30 }}
                  />
                ) : null}
                <span className="relative">{texto}</span>
              </Link>
            );
          })}
        </nav>

        {hidratado && liga.totalPartidos > 0 ? (
          <span className="rotulo ml-auto hidden text-crema/50 sm:block">
            {liga.totalPartidos} partidos · {liga.tabla.length} jugadores
          </span>
        ) : null}
      </div>
    </header>
  );
}

export function BarraInferior() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t-[3px] border-tinta bg-azul-950 md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-between gap-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
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
                  className="absolute inset-0 rounded-sm border-2 border-tinta bg-naranja"
                  transition={{ type: "spring", stiffness: 520, damping: 32 }}
                />
              ) : null}
              <Icono
                className={`relative size-6 ${activa ? "text-tinta" : "text-crema/55"}`}
                strokeWidth={activa ? 2.4 : 2}
              />
              <span
                className={`relative text-[10px] font-bold uppercase tracking-[0.1em] ${
                  activa ? "text-tinta" : "text-crema/55"
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
