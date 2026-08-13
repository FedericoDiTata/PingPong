"use client";

import { motion } from "motion/react";

/**
 * Odómetro: cada dígito rueda a su nueva posición en vez de reemplazarse.
 * Se usa sólo donde el número ES la información (ELO, marcador), nunca de adorno.
 */
function Columna({ digito, indice }: { digito: number; indice: number }) {
  return (
    <span className="relative inline-block h-[1em] overflow-hidden align-baseline">
      {/* Fantasma invisible: fija el ancho real del dígito en la fuente actual */}
      <span className="invisible">{digito}</span>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col items-center"
        animate={{ y: `${-digito * 10}%` }}
        transition={{
          type: "spring",
          stiffness: 190,
          damping: 24,
          mass: 0.55,
          delay: indice * 0.035,
        }}
        style={{ height: "1000%" }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((valor) => (
          <span key={valor} className="flex h-[10%] items-center justify-center leading-none">
            {valor}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export function NumeroRodante({
  valor,
  className = "",
  prefijo,
}: {
  valor: number;
  className?: string;
  prefijo?: string;
}) {
  const texto = Math.abs(Math.round(valor)).toString();
  const signo = valor < 0 ? "−" : prefijo;

  return (
    <span
      className={`inline-flex items-baseline tabular-nums ${className}`}
      aria-label={`${valor}`}
    >
      {signo ? <span aria-hidden>{signo}</span> : null}
      <span aria-hidden className="inline-flex">
        {texto.split("").map((caracter, indice) => (
          <Columna key={`${indice}-${texto.length}`} digito={Number(caracter)} indice={indice} />
        ))}
      </span>
    </span>
  );
}
