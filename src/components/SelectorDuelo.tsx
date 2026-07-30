"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { IconoIntercambio, IconoMas } from "./Iconos";
import type { Liga } from "@/lib/liga";

type Lado = "a" | "b";

function Ranura({
  jugadorId,
  liga,
  activo,
  onClick,
}: {
  jugadorId: string | null;
  liga: Liga;
  activo: boolean;
  onClick: () => void;
}) {
  const jugador = jugadorId ? liga.porId[jugadorId] : null;
  const stats = jugadorId ? liga.stats[jugadorId] : null;

  return (
    <button
      onClick={onClick}
      className={`flex min-w-0 flex-1 flex-col items-center gap-3 rounded-md border px-3 py-5 transition-[border-color,background-color] duration-200 ${
        activo
          ? "border-pelota/60 bg-mesa-850"
          : "border-[var(--borde)] bg-mesa-900 hover:border-[var(--borde-fuerte)]"
      }`}
    >
      {jugador ? (
        <>
          <Avatar jugador={jugador} tamano="lg" />
          <span className="max-w-full truncate text-base font-semibold text-tiza">
            {jugador.nombre}
          </span>
          <span className="font-mono text-2xs text-tiza-45">{stats?.elo ?? 1000} pts</span>
        </>
      ) : (
        <>
          <span className="flex size-14 items-center justify-center rounded-md border border-dashed border-[var(--borde-fuerte)] text-tiza-25">
            <IconoMas className="size-5" />
          </span>
          <span className="text-sm text-tiza-45">Elegir</span>
          <span className="font-mono text-2xs text-tiza-25">—</span>
        </>
      )}
    </button>
  );
}

export function SelectorDuelo({
  liga,
  a,
  b,
  onCambio,
}: {
  liga: Liga;
  a: string | null;
  b: string | null;
  onCambio: (a: string | null, b: string | null) => void;
}) {
  const [editando, setEditando] = useState<Lado | null>(a ? (b ? null : "b") : "a");

  function elegir(id: string) {
    const lado = editando ?? (a ? "b" : "a");

    if (lado === "a") {
      onCambio(id, b === id ? a : b);
      setEditando(b === id || !b ? "b" : null);
    } else {
      onCambio(a === id ? b : a, id);
      setEditando(null);
    }
  }

  function intercambiar() {
    onCambio(b, a);
  }

  const listos = Boolean(a && b);

  return (
    <div className="flex flex-col gap-5">
      <div className="relative flex items-stretch gap-3">
        <Ranura
          jugadorId={a}
          liga={liga}
          activo={editando === "a"}
          onClick={() => setEditando("a")}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <span aria-hidden className="w-px flex-1 border-l border-dashed border-[var(--borde-fuerte)]" />
          {listos ? (
            <button
              onClick={intercambiar}
              aria-label="Intercambiar lados"
              className="rounded-full border border-[var(--borde)] bg-mesa-850 p-2 text-tiza-45 transition-colors duration-150 hover:border-pelota/40 hover:text-pelota"
            >
              <IconoIntercambio className="size-4" />
            </button>
          ) : (
            <span className="font-mono text-2xs uppercase tracking-[0.14em] text-tiza-25">vs</span>
          )}
          <span aria-hidden className="w-px flex-1 border-l border-dashed border-[var(--borde-fuerte)]" />
        </div>

        <Ranura
          jugadorId={b}
          liga={liga}
          activo={editando === "b"}
          onClick={() => setEditando("b")}
        />
      </div>

      <AnimatePresence initial={false}>
        {editando ? (
          <motion.div
            key="lista"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="etiqueta mb-3">
              {editando === "a" ? "Jugador de la izquierda" : "Jugador de la derecha"}
            </p>
            <ul className="flex flex-wrap gap-2">
              {liga.jugadores.map((jugador) => {
                const elegido = jugador.id === a || jugador.id === b;
                return (
                  <li key={jugador.id}>
                    <button
                      onClick={() => elegir(jugador.id)}
                      className={`flex items-center gap-2.5 rounded-md border py-1.5 pl-1.5 pr-3.5 text-sm transition-colors duration-150 ${
                        elegido
                          ? "border-pelota/45 bg-pelota/10 text-tiza"
                          : "border-[var(--borde)] bg-mesa-900 text-tiza-70 hover:border-[var(--borde-fuerte)] hover:text-tiza"
                      }`}
                    >
                      <Avatar jugador={jugador} tamano="xs" />
                      {jugador.nombre}
                      <span className="font-mono text-2xs text-tiza-25">
                        {liga.stats[jugador.id]?.elo ?? 1000}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
