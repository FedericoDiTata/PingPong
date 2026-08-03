"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Avatar } from "./Avatar";
import { escalonar, resorte, resorteFirme } from "@/lib/motion";
import type { Liga } from "@/lib/liga";
import type { Jugador } from "@/lib/types";

type Duelo = {
  uno: Jugador;
  otro: Jugador;
  ganoUno: number;
  ganoOtro: number;
  total: number;
};

/**
 * La tabla de posiciones repetía lo que ya dice el podio. Esto contesta otra
 * pregunta, la que se discute en la mesa: a quién le ganás y a quién no.
 */
function duelosDe(liga: Liga): Duelo[] {
  const duelos: Duelo[] = [];

  for (let i = 0; i < liga.tabla.length; i += 1) {
    for (let j = i + 1; j < liga.tabla.length; j += 1) {
      const uno = liga.tabla[i];
      const otro = liga.tabla[j];
      const marca = uno.h2h[otro.jugador.id];
      if (!marca) continue;

      duelos.push({
        uno: uno.jugador,
        otro: otro.jugador,
        ganoUno: marca.pg,
        ganoOtro: marca.pp,
        total: marca.pg + marca.pp,
      });
    }
  }

  // Primero los cruces más jugados: son los que tienen historia.
  return duelos.sort(
    (x, y) => y.total - x.total || Math.abs(y.ganoUno - y.ganoOtro) - Math.abs(x.ganoUno - x.ganoOtro),
  );
}

function Lado({
  jugador,
  gana,
  derecha,
}: {
  jugador: Jugador;
  gana: boolean;
  derecha?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2.5 ${derecha ? "flex-row-reverse" : ""}`}
    >
      <Avatar jugador={jugador} tamano="sm" />
      <Link
        href={`/jugador/${jugador.id}`}
        className={`display truncate text-lg leading-none hover:text-naranja-hondo md:text-xl ${
          gana ? "text-tinta" : "text-tinta/50"
        }`}
      >
        {jugador.nombre}
      </Link>
    </div>
  );
}

function Cruce({ duelo, indice }: { duelo: Duelo; indice: number }) {
  const { uno, otro, ganoUno, ganoOtro, total } = duelo;
  const parejo = ganoUno === ganoOtro;
  const mandaUno = ganoUno > ganoOtro;
  const ventaja = Math.abs(ganoUno - ganoOtro);

  return (
    <motion.li
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...resorteFirme, delay: escalonar(indice, 0.05) }}
    >
      <motion.div
        whileHover={{ y: -4, rotate: -0.5 }}
        transition={resorte}
        className="cartel flex h-full flex-col gap-3 rounded-md px-3 py-3 md:px-4"
      >
        <div className="flex items-center gap-2">
          <Lado jugador={uno} gana={parejo || mandaUno} />
          <span className="display shrink-0 px-1 text-xl text-tinta/25 md:text-2xl">vs</span>
          <Lado jugador={otro} gana={parejo || !mandaUno} derecha />
        </div>

        {/* La barra es el resumen: se ve quién domina sin leer los números. */}
        <div className="flex h-3.5 overflow-hidden rounded-[3px] border-2 border-tinta bg-azul-800">
          <motion.span
            initial={{ width: "50%" }}
            animate={{ width: `${(ganoUno / total) * 100}%` }}
            transition={{ ...resorte, delay: 0.1 + escalonar(indice, 0.05) }}
            className="block bg-naranja"
          />
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="display text-2xl md:text-3xl">
            <span className={mandaUno || parejo ? "text-tinta" : "text-tinta/40"}>{ganoUno}</span>
            <span className="px-1 text-tinta/25">–</span>
            <span className={!mandaUno || parejo ? "text-tinta" : "text-tinta/40"}>{ganoOtro}</span>
          </span>
          <span className="rotulo text-right text-tinta/45">
            {total} {total === 1 ? "partido" : "partidos"}
            {parejo ? " · empatados" : ` · ${(mandaUno ? uno : otro).nombre} por ${ventaja}`}
          </span>
        </div>
      </motion.div>
    </motion.li>
  );
}

export function ManoAMano({ liga }: { liga: Liga }) {
  const duelos = duelosDe(liga);
  if (duelos.length === 0) return null;

  return (
    <ul className="grid gap-2.5 md:grid-cols-2">
      {duelos.map((duelo, indice) => (
        <Cruce key={`${duelo.uno.id}-${duelo.otro.id}`} duelo={duelo} indice={indice} />
      ))}
    </ul>
  );
}
