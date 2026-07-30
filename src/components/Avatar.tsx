"use client";

import { tonoJugador } from "@/lib/color";
import { iniciales } from "@/lib/format";
import type { Jugador } from "@/lib/types";

const TAMANOS = {
  xs: "size-7 text-sm rounded-xs",
  sm: "size-9 text-base rounded-sm",
  md: "size-11 text-lg rounded-sm",
  lg: "size-14 text-2xl rounded-md",
  xl: "size-20 text-3xl rounded-md",
} as const;

export function Avatar({
  jugador,
  tamano = "md",
  className = "",
}: {
  jugador: Jugador;
  tamano?: keyof typeof TAMANOS;
  className?: string;
}) {
  const tono = tonoJugador(jugador.id);

  return (
    <span
      className={`inline-flex shrink-0 select-none items-center justify-center border ${TAMANOS[tamano]} ${className}`}
      style={{
        backgroundColor: tono.fondo,
        borderColor: tono.borde,
        boxShadow: "inset 0 1px 0 0 oklch(1 0 0 / 0.08)",
      }}
      title={jugador.nombre}
    >
      {jugador.emoji ? (
        <span aria-hidden>{jugador.emoji}</span>
      ) : (
        <span className="font-mono text-[0.7em] font-semibold tracking-tight text-tiza">
          {iniciales(jugador.nombre)}
        </span>
      )}
    </span>
  );
}
