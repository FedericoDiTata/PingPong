"use client";

import { motion } from "motion/react";
import { golpe, resorte } from "@/lib/motion";

export function Pagina({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Encabezado de página: rótulo torcido tipo calcomanía + titular gigante.
 * El título entra por partes para que se sienta el golpe.
 */
export function Encabezado({
  rotulo,
  titulo,
  bajada,
  accion,
}: {
  rotulo: string;
  titulo: string;
  bajada?: string;
  accion?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5 md:mb-12">
      <div className="flex flex-col items-start gap-3">
        <motion.span
          initial={{ opacity: 0, scale: 0.5, rotate: -14 }}
          animate={{ opacity: 1, scale: 1, rotate: -2.5 }}
          transition={golpe}
          className="rotulo border-2 border-tinta bg-naranja px-2.5 py-1.5 text-tinta shadow-[var(--golpe-chico)]"
        >
          {rotulo}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 26, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={resorte}
          className="display text-4xl text-crema md:text-5xl"
        >
          {titulo}
        </motion.h1>

        {bajada ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.14, duration: 0.3 }}
            className="max-w-[46ch] text-sm font-medium text-crema/65"
          >
            {bajada}
          </motion.p>
        ) : null}
      </div>
      {accion}
    </div>
  );
}

export function Cargando() {
  return (
    <div className="flex flex-col gap-4">
      <div className="esqueleto h-32 rounded-lg border-[3px] border-tinta bg-azul-800" />
      <div className="esqueleto h-20 rounded-md border-[3px] border-tinta bg-azul-800" />
      <div className="esqueleto h-20 rounded-md border-[3px] border-tinta bg-azul-800/70" />
    </div>
  );
}
