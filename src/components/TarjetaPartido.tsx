"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Avatar } from "./Avatar";
import { ConfirmarEnLinea } from "./ui";
import { IconoBasura, IconoRayo } from "./Iconos";
import { conSigno, relativo } from "@/lib/format";
import type { Liga, ResultadoPartido } from "@/lib/liga";

function Lado({
  jugadorId,
  liga,
  sets,
  delta,
  ganador,
}: {
  jugadorId: string;
  liga: Liga;
  sets: number;
  delta: number;
  ganador: boolean;
}) {
  const jugador = liga.porId[jugadorId];
  if (!jugador) return null;

  return (
    <div className="flex items-center gap-3">
      <Avatar jugador={jugador} tamano="sm" className={ganador ? "" : "opacity-55 grayscale-[0.4]"} />

      <Link
        href={`/jugador/${jugador.id}`}
        className={`min-w-0 flex-1 truncate text-base transition-colors duration-[120ms] hover:text-pelota ${
          ganador ? "font-semibold text-tiza" : "text-tiza-45"
        }`}
      >
        {jugador.nombre}
      </Link>

      <span
        className={`font-mono text-xs ${delta >= 0 ? "text-gana/80" : "text-pierde/70"}`}
        title="Cambio de puntaje"
      >
        {conSigno(delta)}
      </span>

      <span
        className={`w-6 text-right font-mono text-xl tabular-nums ${
          ganador ? "text-pelota" : "text-tiza-25"
        }`}
      >
        {sets}
      </span>
    </div>
  );
}

export function TarjetaPartido({
  resultado,
  liga,
  onBorrar,
  indice = 0,
}: {
  resultado: ResultadoPartido;
  liga: Liga;
  onBorrar?: () => void;
  indice?: number;
}) {
  const { partido, setsA, setsB, ganadorId, delta } = resultado;
  const games = partido.games.map((game) => `${game.a}-${game.b}`).join("  ");

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.14 } }}
      transition={{
        duration: 0.32,
        delay: Math.min(indice, 10) * 0.024,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group panel rounded-md p-3.5 transition-colors duration-200 hover:border-[var(--borde-fuerte)] hover:bg-mesa-850"
    >
      <div className="flex flex-col gap-2.5">
        <Lado
          jugadorId={partido.jugadorA}
          liga={liga}
          sets={setsA}
          delta={delta.a}
          ganador={ganadorId === partido.jugadorA}
        />
        <Lado
          jugadorId={partido.jugadorB}
          liga={liga}
          sets={setsB}
          delta={delta.b}
          ganador={ganadorId === partido.jugadorB}
        />
      </div>

      <div className="mt-3 flex items-center gap-3 border-t border-[var(--borde)] pt-2.5">
        <span className="font-mono text-2xs tracking-wide text-tiza-25">{games}</span>

        <span className="ml-auto flex items-center gap-2 text-2xs text-tiza-25">
          {partido.origen === "vivo" ? (
            <span className="inline-flex items-center gap-1 text-tiza-45" title="Cargado en vivo">
              <IconoRayo className="size-3" />
              en vivo
            </span>
          ) : null}
          {relativo(partido.jugadoEn)}
        </span>

        {onBorrar ? (
          <ConfirmarEnLinea onConfirmar={onBorrar} pregunta="¿Borrar?">
            {(abrir) => (
              <button
                onClick={abrir}
                aria-label="Borrar partido"
                className="rounded-xs p-1 text-tiza-25 opacity-0 transition-[color,opacity] duration-150 hover:text-pierde focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100"
              >
                <IconoBasura className="size-4" />
              </button>
            )}
          </ConfirmarEnLinea>
        ) : null}
      </div>
    </motion.article>
  );
}
