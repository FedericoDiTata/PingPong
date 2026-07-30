"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

const COLORES = [
  "var(--color-naranja)",
  "var(--color-naranja-claro)",
  "var(--color-crema)",
  "var(--color-azul-500)",
  "var(--color-naranja-hondo)",
];

type Particula = {
  angulo: number;
  distancia: number;
  giro: number;
  tamano: number;
  color: string;
  redonda: boolean;
  demora: number;
};

/** Ruido determinístico: misma semilla, mismo estallido. Sin Math.random en el render. */
function azar(semilla: number) {
  let estado = semilla >>> 0;
  return () => {
    estado += 0x6d2b79f5;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Estallido de partículas para el momento de guardar un resultado.
 * El padre le pasa una semilla nueva en cada guardado (y la usa como key),
 * así cada explosión sale distinta pero el render sigue siendo puro.
 */
export function Explosion({ semilla, cantidad = 28 }: { semilla: number; cantidad?: number }) {
  const particulas = useMemo<Particula[]>(() => {
    const rand = azar(semilla);
    return Array.from({ length: cantidad }, (_, indice) => ({
      angulo: (indice / cantidad) * Math.PI * 2 + (rand() - 0.5) * 0.55,
      distancia: 90 + rand() * 200,
      giro: (rand() - 0.5) * 760,
      tamano: 8 + rand() * 17,
      color: COLORES[indice % COLORES.length],
      redonda: rand() > 0.55,
      demora: rand() * 0.07,
    }));
  }, [semilla, cantidad]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-30 overflow-visible">
      <div className="absolute left-1/2 top-1/2">
        {particulas.map((particula, indice) => (
          <motion.span
            key={indice}
            initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
            animate={{
              x: Math.cos(particula.angulo) * particula.distancia,
              y: Math.sin(particula.angulo) * particula.distancia + 80,
              scale: [0, 1.3, 1, 0.55],
              rotate: particula.giro,
              opacity: [1, 1, 1, 0],
            }}
            transition={{
              duration: 1,
              delay: particula.demora,
              ease: [0.16, 1, 0.3, 1],
              times: [0, 0.18, 0.5, 1],
            }}
            className={`absolute border-2 border-tinta ${
              particula.redonda ? "rounded-full" : "rounded-[2px]"
            }`}
            style={{
              width: particula.tamano,
              height: particula.tamano,
              backgroundColor: particula.color,
              marginLeft: -particula.tamano / 2,
              marginTop: -particula.tamano / 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
