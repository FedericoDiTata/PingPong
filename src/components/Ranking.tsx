"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Avatar } from "./Avatar";
import { Forma } from "./Forma";
import { NumeroRodante } from "./NumeroRodante";
import { IconoFuego } from "./Iconos";
import { escalonar, golpe, resorte, resorteFirme } from "@/lib/motion";
import type { FilaTabla } from "@/lib/liga";

/* ---------------------------------------------------------------- Podio --- */

const ESCALONES = [
  { alto: "h-32 md:h-44", fondo: "bg-naranja", texto: "text-tinta" },
  { alto: "h-24 md:h-32", fondo: "bg-crema", texto: "text-tinta" },
  { alto: "h-20 md:h-26", fondo: "bg-azul-700", texto: "text-crema" },
];

function Escalon({ fila, puesto }: { fila: FilaTabla; puesto: number }) {
  const estilo = ESCALONES[puesto - 1];
  const lider = puesto === 1;

  return (
    <div className="flex min-w-0 max-w-[190px] flex-1 flex-col items-center gap-3">
      <motion.div
        initial={{ opacity: 0, y: -30, scale: 0.5, rotate: -12 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
        transition={{ ...resorte, delay: 0.15 + puesto * 0.09 }}
        className="flex min-w-0 flex-col items-center gap-2"
      >
        <Avatar jugador={fila.jugador} tamano={lider ? "lg" : "md"} />
        <Link
          href={`/jugador/${fila.jugador.id}`}
          className={`display max-w-full truncate px-1 text-center leading-none text-crema hover:text-naranja ${
            lider ? "text-xl md:text-2xl" : "text-base md:text-lg"
          }`}
        >
          {fila.jugador.nombre}
        </Link>
        <span className="rotulo text-crema/55">{fila.pg}G · {fila.pp}P</span>
      </motion.div>

      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: puesto * 0.08 }}
        style={{ transformOrigin: "bottom" }}
        className={`relative flex w-full flex-col items-center justify-center gap-1 rounded-t-lg border-[3px] border-b-0 border-tinta ${estilo.alto} ${estilo.fondo}`}
      >
        {lider ? (
          // El cartelito se hamaca solo: la corona nunca se queda quieta.
          <span className="animate-tiembla">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...golpe, delay: 0.5 }}
              className="display block rounded-sm border-2 border-tinta bg-crema px-2 py-0.5 text-xs text-tinta"
            >
              Rey de la mesa
            </motion.span>
          </span>
        ) : null}
        <span className={`display text-4xl md:text-5xl ${estilo.texto}`}>{puesto}</span>
        <span className={`rotulo ${estilo.texto} opacity-70`}>{fila.elo}</span>
      </motion.div>
    </div>
  );
}

export function Podio({ tabla }: { tabla: FilaTabla[] }) {
  const podio = tabla.slice(0, 3);
  if (podio.length === 0) return null;

  const orden = [podio[1], podio[0], podio[2]].filter(Boolean);

  return (
    <section aria-label="Podio" className="mb-12">
      <div className="flex items-end justify-center gap-2 md:gap-4">
        {orden.map((fila) => (
          <Escalon key={fila.jugador.id} fila={fila} puesto={fila.puesto} />
        ))}
      </div>
      <div className="h-[3px] w-full bg-tinta" />
    </section>
  );
}

/* --------------------------------------------------------------- Tabla --- */

function Movimiento({ delta }: { delta: number }) {
  if (delta === 0) return null;

  const sube = delta > 0;
  return (
    <motion.span
      initial={{ opacity: 0, y: sube ? 8 : -8, scale: 0.5 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={golpe}
      className={`flex items-center gap-0.5 rounded-[3px] border-2 border-tinta px-1 py-0.5 text-[10px] font-black ${
        sube ? "bg-naranja text-tinta" : "bg-azul-800 text-crema"
      }`}
      title={sube ? `Subió ${delta} puesto(s)` : `Bajó ${Math.abs(delta)} puesto(s)`}
    >
      <svg viewBox="0 0 8 6" className="size-1.5" fill="currentColor" aria-hidden>
        <path d={sube ? "M4 0 8 6H0z" : "M4 6 0 0h8z"} />
      </svg>
      {Math.abs(delta)}
    </motion.span>
  );
}

function Fila({ fila, indice }: { fila: FilaTabla; indice: number }) {
  const lider = fila.puesto === 1;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -28, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ ...resorteFirme, delay: escalonar(indice, 0.04) }}
    >
      <Link href={`/jugador/${fila.jugador.id}`} className="block">
        <motion.div
          whileHover={{ y: -4, rotate: -0.6 }}
          whileTap={{ scale: 0.985 }}
          transition={resorte}
          className="cartel flex items-center gap-3 rounded-md px-2.5 py-2.5 md:gap-4 md:px-4 md:py-3"
        >
          <span
            className={`display flex size-11 shrink-0 items-center justify-center rounded-sm border-[3px] border-tinta text-2xl md:size-13 md:text-3xl ${
              lider ? "bg-naranja text-tinta" : "bg-azul-800 text-crema"
            }`}
          >
            {fila.puesto}
          </span>

          <Avatar jugador={fila.jugador} tamano="sm" />

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="flex items-center gap-2">
              <span className="display truncate text-xl leading-none text-tinta md:text-2xl">
                {fila.jugador.nombre}
              </span>
              <Movimiento delta={fila.deltaPuesto} />
              {fila.racha.tipo === "G" && fila.racha.largo >= 3 ? (
                <span
                  className="flex shrink-0 items-center gap-0.5 rounded-[3px] border-2 border-tinta bg-naranja px-1 py-0.5 text-[10px] font-black text-tinta"
                  title={`${fila.racha.largo} victorias seguidas`}
                >
                  <IconoFuego className="size-2.5" />
                  {fila.racha.largo}
                </span>
              ) : null}
            </span>

            <div className="flex items-center gap-2">
              <span className="display text-sm text-tinta/70">
                {fila.pg}<span className="text-tinta/35">G</span> · {fila.pp}
                <span className="text-tinta/35">P</span>
              </span>
              <span className="hidden md:block">
                <Forma resultados={fila.forma.slice(0, 6)} chico />
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end">
            <NumeroRodante valor={fila.elo} className="display text-2xl text-tinta md:text-3xl" />
            <span className="rotulo text-tinta/40">puntos</span>
          </div>
        </motion.div>
      </Link>
    </motion.li>
  );
}

export function TablaPosiciones({ tabla }: { tabla: FilaTabla[] }) {
  if (tabla.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2.5">
      {tabla.map((fila, indice) => (
        <Fila key={fila.jugador.id} fila={fila} indice={indice} />
      ))}
    </ul>
  );
}
