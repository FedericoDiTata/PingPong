"use client";

import { motion } from "motion/react";

/** Últimos resultados, el más reciente primero. Barras, no letras: se lee de un vistazo. */
export function Forma({
  resultados,
  compacto = false,
}: {
  resultados: Array<"G" | "P">;
  compacto?: boolean;
}) {
  if (resultados.length === 0) {
    return <span className="text-2xs text-tiza-25">sin datos</span>;
  }

  return (
    <div
      className="flex items-center gap-[3px]"
      aria-label={`Últimos resultados: ${resultados.join(", ")}`}
    >
      {resultados.map((resultado, indice) => (
        <motion.span
          key={indice}
          initial={{ scaleY: 0.3, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 - indice * 0.13 }}
          transition={{ duration: 0.28, delay: indice * 0.03, ease: [0.16, 1, 0.3, 1] }}
          className={`block rounded-[2px] ${compacto ? "h-3 w-[3px]" : "h-4 w-1"} ${
            resultado === "G" ? "bg-gana" : "bg-pierde/55"
          }`}
        />
      ))}
    </div>
  );
}
