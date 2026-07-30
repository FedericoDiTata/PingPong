"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Avatar } from "./Avatar";
import { ConfirmarEnLinea } from "./ui";
import { IconoBasura } from "./Iconos";
import { conSigno, relativo } from "@/lib/format";
import type { Liga, ResultadoPartido } from "@/lib/liga";
import { escalonar, resorte } from "@/lib/motion";

export function TarjetaPartido({
  resultado,
  liga,
  onBorrar,
  indice = 0,
  destacarA,
}: {
  resultado: ResultadoPartido;
  liga: Liga;
  onBorrar?: () => void;
  indice?: number;
  /** Id del jugador cuyo perfil estamos mirando, para marcar si ganó o perdió. */
  destacarA?: string;
}) {
  const ganador = liga.porId[resultado.ganadorId];
  const perdedor = liga.porId[resultado.perdedorId];
  if (!ganador || !perdedor) return null;

  const mirandoAlGanador = destacarA === ganador.id;
  const mirandoAlPerdedor = destacarA === perdedor.id;

  const deltaGanador =
    resultado.ganadorId === resultado.partido.jugadorA
      ? resultado.delta.a
      : resultado.delta.b;

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 22, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={{ ...resorte, delay: escalonar(indice, 0.04) }}
      whileHover={{ y: -3, rotate: -0.5 }}
      className="cartel rounded-md px-3.5 py-3"
    >
      <div className="flex items-center gap-3">
        <Avatar jugador={ganador} tamano="sm" />

        <div className="min-w-0 flex-1">
          <Link
            href={`/jugador/${ganador.id}`}
            className="display block truncate text-2xl leading-none text-tinta hover:text-naranja-hondo"
          >
            {ganador.nombre}
          </Link>
          <span className="mt-1 flex items-center gap-1.5 text-xs font-bold text-tinta/55">
            le ganó a
            <Link
              href={`/jugador/${perdedor.id}`}
              className="truncate underline decoration-tinta/25 underline-offset-2 hover:text-tinta"
            >
              {perdedor.nombre}
            </Link>
          </span>
        </div>

        {resultado.puntosGanador !== null ? (
          <span className="display shrink-0 -rotate-2 rounded-sm border-[3px] border-tinta bg-naranja px-2.5 py-1 text-2xl text-tinta">
            {resultado.puntosGanador}–{resultado.puntosPerdedor}
          </span>
        ) : (
          <span className="rotulo shrink-0 rounded-sm border-2 border-tinta/25 px-2 py-1.5 text-tinta/40">
            sin marcador
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-3 border-t-2 border-tinta/12 pt-2">
        <span className="text-2xs font-bold uppercase tracking-[0.1em] text-tinta/45">
          {relativo(resultado.partido.jugadoEn)}
        </span>

        {mirandoAlGanador || mirandoAlPerdedor ? (
          <span
            className={`rotulo rounded-sm px-1.5 py-1 ${
              mirandoAlGanador ? "bg-naranja text-tinta" : "bg-azul-800 text-crema"
            }`}
          >
            {mirandoAlGanador ? `ganó ${conSigno(deltaGanador)}` : "perdió"}
          </span>
        ) : null}

        {onBorrar ? (
          <div className="ml-auto">
            <ConfirmarEnLinea onConfirmar={onBorrar} pregunta="¿Borrar?">
              {(abrir) => (
                <button
                  onClick={abrir}
                  aria-label="Borrar partido"
                  className="rounded-sm p-1 text-tinta/35 transition-colors duration-100 hover:text-naranja-hondo"
                >
                  <IconoBasura className="size-4" />
                </button>
              )}
            </ConfirmarEnLinea>
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}
