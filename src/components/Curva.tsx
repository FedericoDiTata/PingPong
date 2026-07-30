"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { ELO_INICIAL } from "@/lib/elo";

/**
 * Evolución del puntaje. El eje Y se escala al recorrido real del jugador, con
 * la línea de 1000 (donde arrancan todos) marcada como referencia.
 */
export function Curva({
  valores,
  color,
  alto = 120,
  className = "",
}: {
  valores: number[];
  color: string;
  alto?: number;
  className?: string;
}) {
  const id = useId();

  if (valores.length < 2) {
    return (
      <div
        className={`flex items-center justify-center text-xs font-bold text-tinta/40 ${className}`}
        style={{ height: alto }}
      >
        Con dos partidos ya se dibuja la curva
      </div>
    );
  }

  const serie = [ELO_INICIAL, ...valores];
  const maximo = Math.max(...serie);
  const minimo = Math.min(...serie);
  const rango = Math.max(maximo - minimo, 24);
  const techo = maximo + rango * 0.2;
  const piso = minimo - rango * 0.2;

  const x = (indice: number) => (indice / (serie.length - 1)) * 100;
  const y = (valor: number) => ((techo - valor) / (techo - piso)) * alto;

  const linea = serie.map((valor, indice) => `${x(indice)},${y(valor)}`).join(" ");
  const area = `${x(0)},${alto} ${linea} ${x(serie.length - 1)},${alto}`;
  const baseY = y(ELO_INICIAL);
  const finY = y(serie[serie.length - 1]);

  return (
    <div className={`relative ${className}`} style={{ height: alto }}>
      <svg
        viewBox={`0 0 100 ${alto}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        role="img"
        aria-label="Evolución del puntaje"
      >
        <defs>
          <linearGradient id={`relleno-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <line
          x1="0"
          x2="100"
          y1={baseY}
          y2={baseY}
          stroke="var(--color-tinta)"
          strokeWidth="2"
          strokeDasharray="5 5"
          strokeOpacity="0.3"
          vectorEffect="non-scaling-stroke"
        />

        <motion.polygon
          points={area}
          fill={`url(#relleno-${id})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        />

        <motion.polyline
          points={linea}
          fill="none"
          stroke="var(--color-tinta)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>

      {/* El punto final va en HTML: dentro del SVG estirado sería una elipse */}
      <motion.span
        className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-tinta"
        style={{ left: "100%", top: `${(finY / alto) * 100}%`, backgroundColor: color }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 14, delay: 0.85 }}
      />
    </div>
  );
}
