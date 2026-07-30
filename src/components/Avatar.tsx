"use client";

import { tonoJugador } from "@/lib/color";
import { iniciales } from "@/lib/format";
import type { Jugador } from "@/lib/types";

const TAMANOS = {
  xs: "size-8 text-base rounded-sm border-2",
  sm: "size-11 text-xl rounded-md border-[3px]",
  md: "size-14 text-2xl rounded-md border-[3px]",
  lg: "size-20 text-4xl rounded-lg border-[3px]",
  xl: "size-28 text-6xl rounded-lg border-[4px]",
} as const;

export function Avatar({
  jugador,
  tamano = "md",
  className = "",
  torcido = true,
}: {
  jugador: Jugador;
  tamano?: keyof typeof TAMANOS;
  className?: string;
  torcido?: boolean;
}) {
  const tono = tonoJugador(jugador.id);

  return (
    <span
      className={`inline-flex shrink-0 select-none items-center justify-center border-tinta ${TAMANOS[tamano]} ${className}`}
      style={{
        backgroundColor: tono.fondo,
        boxShadow: "var(--golpe-chico)",
        transform: torcido ? `rotate(${tono.inclinacion}deg)` : undefined,
      }}
      title={jugador.nombre}
    >
      {jugador.emoji ? (
        <span aria-hidden>{jugador.emoji}</span>
      ) : (
        <span className="display text-[0.55em] text-tinta">{iniciales(jugador.nombre)}</span>
      )}
    </span>
  );
}
