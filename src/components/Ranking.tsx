"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Avatar } from "./Avatar";
import { Forma } from "./Forma";
import { NumeroRodante } from "./NumeroRodante";
import { IconoFuego } from "./Iconos";
import { tonoJugador } from "@/lib/color";
import type { FilaTabla } from "@/lib/liga";

/* ---------------------------------------------------------------- Podio --- */

const ALTURAS = ["h-[104px] md:h-[132px]", "h-[78px] md:h-[100px]", "h-[62px] md:h-[80px]"];

function Escalon({ fila, puesto }: { fila: FilaTabla; puesto: number }) {
  const tono = tonoJugador(fila.jugador.id);
  const lider = puesto === 1;

  return (
    <div className="flex min-w-0 max-w-[164px] flex-1 flex-col items-center gap-3">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.22 + puesto * 0.06, ease: [0.16, 1, 0.3, 1] }}
        className="flex min-w-0 flex-col items-center gap-2"
      >
        <Avatar jugador={fila.jugador} tamano={lider ? "lg" : "md"} />
        <Link
          href={`/jugador/${fila.jugador.id}`}
          className={`max-w-full truncate px-1 text-center transition-colors duration-[120ms] hover:text-pelota ${
            lider ? "text-base font-semibold text-tiza" : "text-sm text-tiza-70"
          }`}
        >
          {fila.jugador.nombre}
        </Link>
        <span className="font-mono text-xs tabular-nums text-tiza-45">{fila.elo}</span>
      </motion.div>

      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.55, delay: puesto * 0.07, ease: [0.16, 1, 0.3, 1] }}
        style={{
          transformOrigin: "bottom",
          backgroundColor: lider ? "oklch(0.3 0.062 62)" : "var(--color-mesa-850)",
          borderColor: lider ? "var(--borde-pelota)" : "var(--borde)",
          boxShadow: lider ? "0 0 32px -12px var(--color-pelota)" : undefined,
        }}
        className={`relative flex w-full items-end justify-center rounded-t-md border border-b-0 ${ALTURAS[puesto - 1]}`}
      >
        <span
          className={`pb-2 font-mono text-2xl tabular-nums ${lider ? "text-pelota" : "text-tiza-25"}`}
        >
          {puesto}
        </span>
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{ backgroundColor: lider ? tono.borde : "var(--borde-fuerte)" }}
        />
      </motion.div>
    </div>
  );
}

export function Podio({ tabla }: { tabla: FilaTabla[] }) {
  const podio = tabla.slice(0, 3);
  if (podio.length === 0) return null;

  // 2º a la izquierda, 1º al centro, 3º a la derecha.
  const orden = [podio[1], podio[0], podio[2]].filter(Boolean);

  return (
    <section aria-label="Podio" className="mb-10">
      <div className="flex items-end justify-center gap-2 md:gap-4">
        {orden.map((fila) => (
          <Escalon key={fila.jugador.id} fila={fila} puesto={fila.puesto} />
        ))}
      </div>
      <div className="h-px linea-tiza" />
    </section>
  );
}

/* --------------------------------------------------------------- Tabla --- */

function Movimiento({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span aria-hidden className="block h-1 w-1 rounded-full bg-tiza-25/60" title="Sin cambios" />
    );
  }

  const sube = delta > 0;
  return (
    <motion.span
      initial={{ opacity: 0, y: sube ? 4 : -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-center gap-0.5 font-mono text-2xs ${sube ? "text-gana" : "text-pierde"}`}
      title={sube ? `Subió ${delta} puesto(s)` : `Bajó ${Math.abs(delta)} puesto(s)`}
    >
      <svg viewBox="0 0 8 6" className="size-1.5" fill="currentColor" aria-hidden>
        <path d={sube ? "M4 0 8 6H0z" : "M4 6 0 0h8z"} />
      </svg>
      {Math.abs(delta)}
    </motion.span>
  );
}

function Fila({ fila, maximo, minimo }: { fila: FilaTabla; maximo: number; minimo: number }) {
  const tono = tonoJugador(fila.jugador.id);
  const rango = Math.max(maximo - minimo, 1);
  const fuerza = 0.18 + ((fila.elo - minimo) / rango) * 0.82;

  return (
    <motion.li
      layout
      transition={{ type: "spring", stiffness: 420, damping: 42 }}
      className="relative"
    >
      <Link
        href={`/jugador/${fila.jugador.id}`}
        className="group relative flex items-center gap-3 overflow-hidden rounded-md border border-transparent px-3 py-3 transition-colors duration-150 hover:border-[var(--borde)] hover:bg-mesa-900 md:gap-4 md:px-4"
      >
        {/* Barra de fuerza relativa: el ranking se lee sin comparar números.
            El degradado evita el corte duro y el radio deformado por el escalado. */}
        <motion.span
          aria-hidden
          initial={{ scaleX: 0 }}
          animate={{ scaleX: fuerza }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-y-0 left-0 w-full origin-left"
          style={{
            backgroundImage: `linear-gradient(to right, ${tono.tenue}, ${tono.tenue} 45%, transparent)`,
          }}
        />

        <div className="relative flex w-7 flex-col items-center gap-1">
          <span
            className={`font-mono text-sm tabular-nums ${
              fila.puesto === 1 ? "text-pelota" : "text-tiza-45"
            }`}
          >
            {fila.puesto}
          </span>
          <Movimiento delta={fila.deltaPuesto} />
        </div>

        <Avatar jugador={fila.jugador} tamano="sm" className="relative" />

        <div className="relative flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex items-center gap-2 truncate text-base font-medium text-tiza">
            {fila.jugador.nombre}
            {fila.racha.tipo === "G" && fila.racha.largo >= 3 ? (
              <span
                className="inline-flex items-center gap-0.5 rounded-xs bg-pelota/12 px-1.5 py-0.5 font-mono text-2xs text-pelota"
                title={`${fila.racha.largo} victorias seguidas`}
              >
                <IconoFuego className="size-3" />
                {fila.racha.largo}
              </span>
            ) : null}
          </span>
          <div className="md:hidden">
            <Forma resultados={fila.forma} compacto />
          </div>
        </div>

        <div className="relative hidden w-[4.5rem] md:block">
          <Forma resultados={fila.forma} />
        </div>

        <div className="relative hidden w-24 justify-end gap-1 font-mono text-sm tabular-nums text-tiza-45 md:flex">
          <span className="text-gana">{fila.pg}</span>
          <span className="text-tiza-25">·</span>
          <span className="text-pierde/80">{fila.pp}</span>
        </div>

        <div className="relative flex w-[4.5rem] flex-col items-end gap-0.5">
          <NumeroRodante
            valor={fila.elo}
            className="font-mono text-lg font-medium leading-none text-tiza"
          />
          <span className="font-mono text-2xs text-tiza-25">{fila.pj} PJ</span>
        </div>
      </Link>
    </motion.li>
  );
}

export function TablaPosiciones({ tabla }: { tabla: FilaTabla[] }) {
  if (tabla.length === 0) return null;

  const valores = tabla.map((fila) => fila.elo);
  const maximo = Math.max(...valores);
  const minimo = Math.min(...valores);

  return (
    <div>
      <div className="mb-2 hidden items-center gap-4 px-4 md:flex">
        <span className="etiqueta w-7 text-center">#</span>
        <span className="etiqueta w-9" />
        <span className="etiqueta flex-1">Jugador</span>
        <span className="etiqueta w-[4.5rem]">Forma</span>
        <span className="etiqueta w-24 text-right">G · P</span>
        <span className="etiqueta w-[4.5rem] text-right">Puntaje</span>
      </div>

      <ul className="flex flex-col gap-1">
        {tabla.map((fila) => (
          <Fila key={fila.jugador.id} fila={fila} maximo={maximo} minimo={minimo} />
        ))}
      </ul>
    </div>
  );
}
