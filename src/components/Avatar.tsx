"use client";

import { useState } from "react";
import { tonoJugador } from "@/lib/color";
import { iniciales } from "@/lib/format";
import { fotoDe } from "@/lib/fotos";
import type { Jugador } from "@/lib/types";

const TAMANOS = {
  xs: "size-8 text-base rounded-sm border-2",
  sm: "size-11 text-xl rounded-md border-[3px]",
  md: "size-14 text-2xl rounded-md border-[3px]",
  lg: "size-20 text-4xl rounded-lg border-[3px]",
  xl: "size-28 text-6xl rounded-lg border-[4px]",
} as const;

/** Mismos tamaños pero a partir de `md`: el podio necesita achicarse en el celular. */
const TAMANOS_ANCHO = {
  xs: "md:size-8 md:text-base md:rounded-sm",
  sm: "md:size-11 md:text-xl md:rounded-md",
  md: "md:size-14 md:text-2xl md:rounded-md",
  lg: "md:size-20 md:text-4xl md:rounded-lg",
  xl: "md:size-28 md:text-6xl md:rounded-lg",
} as const;

export function Avatar({
  jugador,
  tamano = "md",
  tamanoAncho,
  className = "",
  torcido = true,
}: {
  jugador: Jugador;
  tamano?: keyof typeof TAMANOS;
  /** Tamaño a partir de pantallas medianas. Si se omite, no cambia. */
  tamanoAncho?: keyof typeof TAMANOS;
  className?: string;
  torcido?: boolean;
}) {
  const tono = tonoJugador(jugador.id);
  const foto = fotoDe(jugador.id);

  // Si el archivo no está (todavía no se subió, o se renombró), el avatar
  // vuelve al emoji en vez de mostrar el ícono de imagen rota.
  const [fotoRota, setFotoRota] = useState(false);

  return (
    <span
      className={`inline-flex shrink-0 select-none items-center justify-center overflow-hidden border-tinta ${
        TAMANOS[tamano]
      } ${tamanoAncho ? TAMANOS_ANCHO[tamanoAncho] : ""} ${className}`}
      style={{
        backgroundColor: tono.fondo,
        boxShadow: "var(--golpe-chico)",
        transform: torcido ? `rotate(${tono.inclinacion}deg)` : undefined,
      }}
      title={jugador.nombre}
    >
      {foto && !fotoRota ? (
        // Archivo estático servido por el propio hosting: next/image no aporta
        // nada acá y complicaría el recorte cuadrado.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={foto}
          alt=""
          className="size-full object-cover"
          onError={() => setFotoRota(true)}
        />
      ) : jugador.emoji ? (
        <span aria-hidden>{jugador.emoji}</span>
      ) : (
        <span className="display text-[0.55em] text-tinta">{iniciales(jugador.nombre)}</span>
      )}
    </span>
  );
}
