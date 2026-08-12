"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { resorte } from "@/lib/motion";
import { useLiga } from "@/lib/store";

/**
 * Cartel de alerta cuando el navegador rechaza guardar.
 *
 * Sin esto la app miente: sigue funcionando con todo en memoria y el usuario
 * se entera de que perdió lo que cargó recién la próxima vez que abre.
 */
export function AvisoAlmacenamiento() {
  const { hidratado, guardado } = useLiga();

  return (
    <AnimatePresence>
      {hidratado && !guardado ? (
        <motion.aside
          role="alert"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={resorte}
          className="cartel fixed inset-x-3 bottom-24 z-40 mx-auto max-w-lg rounded-md px-4 py-3 md:bottom-5"
        >
          <p className="display text-lg text-tinta">No se está guardando</p>
          <p className="mt-1 text-xs font-bold leading-relaxed text-tinta/70">
            Este navegador rechazó guardar la liga: lo que cargues ahora se pierde al cerrar la
            página. Puede ser modo incógnito o falta de espacio.{" "}
            <Link href="/jugadores" className="underline underline-offset-2 hover:text-tinta">
              Descargá una copia
            </Link>{" "}
            antes de seguir.
          </p>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
