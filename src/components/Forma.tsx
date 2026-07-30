"use client";

import { motion } from "motion/react";
import { golpe } from "@/lib/motion";

/**
 * Últimos resultados, el más reciente primero. Fichas con letra, no barritas:
 * a esta escala se lee "G G P G" de un vistazo desde el otro lado de la mesa.
 */
export function Forma({
  resultados,
  chico = false,
}: {
  resultados: Array<"G" | "P">;
  chico?: boolean;
}) {
  if (resultados.length === 0) {
    return <span className="rotulo text-crema/40">sin partidos</span>;
  }

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`Últimos resultados: ${resultados.join(", ")}`}
    >
      {resultados.map((resultado, indice) => (
        <motion.span
          key={indice}
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...golpe, delay: indice * 0.035 }}
          className={`display flex items-center justify-center border-2 border-tinta ${
            chico ? "size-5 rounded-[3px] text-[11px]" : "size-7 rounded-sm text-sm"
          } ${resultado === "G" ? "bg-naranja text-tinta" : "bg-azul-950 text-crema/70"}`}
        >
          {resultado}
        </motion.span>
      ))}
    </div>
  );
}
