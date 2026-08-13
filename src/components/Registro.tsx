"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { relativo } from "@/lib/format";
import type { Liga } from "@/lib/liga";
import { escalonar, resorte } from "@/lib/motion";
import { describir } from "@/lib/registro";
import type { Movimiento } from "@/lib/types";

const DE_ENTRADA = 12;

/**
 * Quién tocó qué. Va al pie del historial, plegado.
 *
 * Plegado a propósito: lo que uno viene a ver al historial son los partidos, no
 * la auditoría. El registro importa el día que alguien pregunta "¿y esto quién
 * lo cargó?", y ese día tiene que estar. No antes.
 */
export function Registro({ movimientos, liga }: { movimientos: Movimiento[]; liga: Liga }) {
  const [abierto, setAbierto] = useState(false);
  const [todos, setTodos] = useState(false);

  if (movimientos.length === 0) return null;

  const visibles = todos ? movimientos : movimientos.slice(0, DE_ENTRADA);

  return (
    <section className="mt-14 border-t-2 border-crema/12 pt-6">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="display text-xl text-crema/80 md:text-2xl">Quién anotó qué</span>
        <span className="rotulo shrink-0 rounded-sm border-2 border-crema/25 px-2 py-1 text-crema/50">
          {abierto ? "ocultar" : `${movimientos.length} movimientos`}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {abierto ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className="pt-4 text-xs font-bold leading-relaxed text-crema/45">
              Cada carga y cada borrado queda firmado con el nombre del dispositivo que lo hizo.
              Nadie puede editar ni borrar estas líneas, tampoco desde la app.
            </p>

            <ol className="mt-4 flex flex-col gap-1.5">
              {visibles.map((movimiento, indice) => (
                <motion.li
                  key={movimiento.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...resorte, delay: escalonar(indice, 0.02) }}
                  className="flex flex-wrap items-baseline gap-x-2 border-l-4 border-crema/15 py-1 pl-3"
                >
                  <span
                    className={`display text-lg leading-none ${
                      movimiento.tipo === "baja" ? "text-naranja" : "text-crema/85"
                    }`}
                  >
                    {movimiento.quienNombre}
                  </span>
                  <span className="text-xs font-bold text-crema/55">
                    {describir(movimiento, liga)}
                  </span>
                  <span className="ml-auto shrink-0 text-2xs font-black uppercase tracking-[0.1em] text-crema/30">
                    {relativo(movimiento.cuando)}
                  </span>
                </motion.li>
              ))}
            </ol>

            {!todos && movimientos.length > DE_ENTRADA ? (
              <button
                onClick={() => setTodos(true)}
                className="mt-4 text-2xs font-black uppercase tracking-[0.12em] text-crema/45 underline underline-offset-4 hover:text-crema"
              >
                Ver los {movimientos.length}
              </button>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
