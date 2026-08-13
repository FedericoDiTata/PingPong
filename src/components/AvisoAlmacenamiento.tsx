"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { enlaceProduccion, esVistaPrevia } from "@/lib/despliegue";
import { resorte } from "@/lib/motion";
import { useLiga } from "@/lib/store";

/**
 * Carteles sobre dónde y si se están guardando los datos.
 *
 * Sin esto la app miente: si no puede guardar, sigue andando con todo en
 * memoria; y si la abriste en una dirección nueva, la liga sembrada la deja
 * igual de poblada que siempre. En los dos casos el usuario se entera de que
 * perdió lo suyo mucho después.
 *
 * Con la liga en Supabase, los avisos de dirección dejan de tener sentido
 * (los datos ya no dependen del navegador) y sólo queda el de conexión.
 */
export function AvisoAlmacenamiento() {
  const { hidratado, guardado, sembrada, compartida } = useLiga();
  const [visto, setVisto] = useState(false);

  const direccion = typeof window === "undefined" ? "" : window.location.host;

  return (
    <AnimatePresence>
      {hidratado && !guardado ? (
        <motion.aside
          key="sin-guardar"
          role="alert"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={resorte}
          className="cartel fixed inset-x-3 bottom-24 z-40 mx-auto max-w-lg rounded-md px-4 py-3 md:bottom-5"
        >
          <p className="display text-lg text-tinta">No se está guardando</p>
          <p className="mt-1 text-xs font-bold leading-relaxed text-tinta/70">
            {compartida ? (
              <>
                No se pudo llegar a la base de datos. Lo que cargues ahora se ve sólo en este
                teléfono y no le llega a los demás. Revisá la conexión y volvé a entrar.
              </>
            ) : (
              <>
                Este navegador rechazó guardar la liga: lo que cargues ahora se pierde al cerrar la
                página. Puede ser modo incógnito o falta de espacio.{" "}
                <Link href="/jugadores" className="underline underline-offset-2 hover:text-tinta">
                  Descargá una copia
                </Link>{" "}
                antes de seguir.
              </>
            )}
          </p>
        </motion.aside>
      ) : null}

      {/* Los dos avisos que siguen son sobre el guardado por dirección, que es
          un problema exclusivo de la liga guardada en el navegador. */}
      {hidratado && !compartida && esVistaPrevia && !visto ? (
        <motion.aside
          key="vista-previa"
          role="alert"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={resorte}
          className="fixed inset-x-3 bottom-24 z-40 mx-auto max-w-lg rounded-md border-[3px] border-tinta bg-naranja px-4 py-3 shadow-[var(--golpe)] md:bottom-5"
        >
          <p className="display text-lg text-tinta">Esta es una vista previa</p>
          <p className="mt-1 text-xs font-bold leading-relaxed text-tinta/80">
            Vercel crea una dirección nueva por cada cambio que se sube, y el navegador guarda los
            datos por dirección. Acá vas a ver siempre la liga inicial: tus fotos y tus partidos
            están en el link de siempre.
          </p>
          {enlaceProduccion ? (
            <a
              href={enlaceProduccion}
              className="mt-2 inline-block rounded-sm border-2 border-tinta bg-crema px-2.5 py-1 text-2xs font-black uppercase tracking-[0.1em] text-tinta"
            >
              Ir a la liga de verdad →
            </a>
          ) : null}
          <button
            onClick={() => setVisto(true)}
            className="ml-3 text-2xs font-black uppercase tracking-[0.12em] text-tinta/60 underline underline-offset-2 hover:text-tinta"
          >
            Quedarme acá
          </button>
        </motion.aside>
      ) : null}

      {hidratado && !compartida && guardado && sembrada && !esVistaPrevia && !visto ? (
        <motion.aside
          key="sembrada"
          role="status"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={resorte}
          className="cartel fixed inset-x-3 bottom-24 z-40 mx-auto max-w-lg rounded-md px-4 py-3 md:bottom-5"
        >
          <p className="display text-lg text-tinta">Liga nueva en {direccion}</p>
          <p className="mt-1 text-xs font-bold leading-relaxed text-tinta/70">
            Acá no había nada guardado, así que se cargó el historial inicial. Si esperabas
            encontrar tus fotos y los partidos que anotaste, están en la dirección donde los
            cargaste: el navegador guarda por dirección exacta, puerto incluido.
          </p>
          <button
            onClick={() => setVisto(true)}
            className="mt-2 text-2xs font-black uppercase tracking-[0.12em] text-tinta/50 underline underline-offset-2 hover:text-tinta"
          >
            Entendido
          </button>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
