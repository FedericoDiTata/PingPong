"use client";

import { motion } from "motion/react";

/** Entrada de página: 200 ms y 6 px. Se percibe, no se espera. */
export function Pagina({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Encabezado({
  etiqueta,
  titulo,
  bajada,
  accion,
}: {
  etiqueta: string;
  titulo: string;
  bajada?: string;
  accion?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
      <div className="flex flex-col gap-2.5">
        <span className="etiqueta">{etiqueta}</span>
        <h1 className="text-3xl font-semibold tracking-[-0.025em] text-tiza md:text-4xl">
          {titulo}
        </h1>
        {bajada ? <p className="max-w-[46ch] text-sm text-tiza-45">{bajada}</p> : null}
      </div>
      {accion}
    </div>
  );
}

/** Placeholder mientras se lee localStorage: evita el parpadeo de "no hay nada". */
export function Cargando() {
  return (
    <div className="flex flex-col gap-3">
      <div className="esqueleto h-28 rounded-lg bg-mesa-900" />
      <div className="esqueleto h-14 rounded-md bg-mesa-900" />
      <div className="esqueleto h-14 rounded-md bg-mesa-900/70" />
      <div className="esqueleto h-14 rounded-md bg-mesa-900/40" />
    </div>
  );
}
