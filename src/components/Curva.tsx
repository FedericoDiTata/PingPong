"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { ELO_INICIAL } from "@/lib/elo";

/**
 * Evolución del ELO. El eje Y se escala al recorrido real del jugador, con la
 * línea de 1000 (punto de partida de todos) marcada como referencia de tiza.
 */
export function Curva({
  valores,
  color,
  alto = 96,
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
        className={`flex items-center justify-center text-2xs text-tiza-25 ${className}`}
        style={{ height: alto }}
      >
        Hacen falta dos partidos para dibujar la curva
      </div>
    );
  }

  const serie = [ELO_INICIAL, ...valores];
  const maximo = Math.max(...serie);
  const minimo = Math.min(...serie);
  const rango = Math.max(maximo - minimo, 24);
  const techo = maximo + rango * 0.18;
  const piso = minimo - rango * 0.18;

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
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        <line
          x1="0"
          x2="100"
          y1={baseY}
          y2={baseY}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 4"
          vectorEffect="non-scaling-stroke"
          className="text-tiza-25"
        />

        <motion.polygon
          points={area}
          fill={`url(#relleno-${id})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        />

        <motion.polyline
          points={linea}
          fill="none"
          stroke={color}
          strokeWidth="2"
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
        className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
        style={{
          left: "100%",
          top: `${(finY / alto) * 100}%`,
          backgroundColor: color,
          borderColor: "var(--color-mesa-900)",
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
