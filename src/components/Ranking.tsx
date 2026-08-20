"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Avatar } from "./Avatar";
import { NumeroRodante } from "./NumeroRodante";
import { porcentaje } from "@/lib/format";
import { escalonar, golpe, resorte, resorteFirme } from "@/lib/motion";
import type { FilaTabla } from "@/lib/liga";

/* ---------------------------------------------------------------- Podio --- */

const ESCALONES = [
  { alto: "h-28 md:h-44", fondo: "bg-naranja", texto: "text-tinta" },
  { alto: "h-22 md:h-32", fondo: "bg-crema", texto: "text-tinta" },
  { alto: "h-18 md:h-26", fondo: "bg-azul-700", texto: "text-crema" },
  { alto: "h-14 md:h-20", fondo: "bg-azul-950", texto: "text-crema" },
];

function Escalon({ fila, puesto }: { fila: FilaTabla; puesto: number }) {
  const estilo = ESCALONES[puesto - 1] ?? ESCALONES[ESCALONES.length - 1];
  const lider = puesto === 1;

  return (
    <div className="flex min-w-0 max-w-[190px] flex-1 flex-col items-center gap-3">
      <motion.div
        initial={{ opacity: 0, y: -30, scale: 0.5, rotate: -12 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
        transition={{ ...resorte, delay: 0.15 + puesto * 0.09 }}
        className="flex min-w-0 flex-col items-center gap-2"
      >
        <Avatar
          jugador={fila.jugador}
          tamano={lider ? "md" : "sm"}
          tamanoAncho={lider ? "lg" : "md"}
        />
        <Link
          href={`/jugador/${fila.jugador.id}`}
          className={`display max-w-full truncate px-1 text-center leading-none text-crema hover:text-naranja ${
            lider ? "text-lg md:text-2xl" : "text-sm md:text-lg"
          }`}
        >
          {fila.jugador.nombre}
        </Link>
        <span className="rotulo text-crema/55">
          {fila.pg}G · {fila.pp}P · {porcentaje(fila.efectividad)}
        </span>
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
              className="display block whitespace-nowrap rounded-sm border-2 border-tinta bg-crema px-1.5 py-0.5 text-[10px] text-tinta md:px-2 md:text-xs"
            >
              {/* En cuatro columnas el nombre largo no entra en el celular. */}
              <span className="md:hidden">Rey</span>
              <span className="hidden md:inline">Rey de la mesa</span>
            </motion.span>
          </span>
        ) : null}
        <span className={`display text-3xl md:text-5xl ${estilo.texto}`}>{puesto}</span>
        <span className={`rotulo ${estilo.texto} opacity-70`}>nivel {fila.nivel.toFixed(1).replace(".", ",")}</span>
      </motion.div>
    </div>
  );
}

export function Podio({ tabla }: { tabla: FilaTabla[] }) {
  const podio = tabla.slice(0, 4);
  if (podio.length === 0) return null;

  // 2º a la izquierda, 1º al centro y de ahí para abajo: la silueta clásica
  // del podio, con el 4º cerrando el escalón más bajo.
  const orden = [podio[1], podio[0], podio[2], podio[3]].filter(Boolean);

  return (
    <section aria-label="Podio" className="mb-12">
      <div className="flex items-end justify-center gap-1.5 md:gap-4">
        {orden.map((fila) => (
          <Escalon key={fila.jugador.id} fila={fila} puesto={fila.puesto} />
        ))}
      </div>
      <div className="h-[3px] w-full bg-tinta" />
    </section>
  );
}

/* --------------------------------------------------------------- Tabla --- */

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
            <span className="display truncate text-xl leading-none text-tinta md:text-2xl">
              {fila.jugador.nombre}
            </span>

            <span className="display text-sm text-tinta/70">
              {fila.pg}
              <span className="text-tinta/35">G</span> · {fila.pp}
              <span className="text-tinta/35">P</span>
              <span className="ml-2 text-tinta/45">{porcentaje(fila.efectividad)}</span>
            </span>
          </div>

          <div className="flex shrink-0 flex-col items-end">
            <NumeroRodante
              valor={fila.nivel}
              decimales={1}
              className="display text-2xl text-tinta md:text-3xl"
            />
            <span className="rotulo text-tinta/40">nivel</span>
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
