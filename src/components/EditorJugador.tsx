"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { IconoCheck } from "./Iconos";
import { Boton } from "./ui";
import { resorte } from "@/lib/motion";
import { EMOJIS, type Jugador } from "@/lib/types";

/**
 * Editor de un jugador: nombre y emoji.
 *
 * La foto no se toca desde acá: son archivos fijos en `public/jugadores/`
 * (ver `src/lib/fotos.ts`). Subirlas desde la app significaba guardarlas en el
 * navegador, y ahí se perdían con sólo abrir la app desde otra dirección.
 */
export function EditorJugador({
  jugador,
  onGuardar,
  onCancelar,
}: {
  jugador: Jugador;
  onGuardar: (cambios: Pick<Jugador, "nombre" | "emoji">) => void;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(jugador.nombre);
  const [emoji, setEmoji] = useState(jugador.emoji);

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={resorte}
      onSubmit={(evento) => {
        evento.preventDefault();
        if (!nombre.trim()) return;
        onGuardar({ nombre, emoji });
      }}
      className="flex w-full flex-col gap-4"
    >
      <div className="flex flex-wrap items-center gap-4">
        <Avatar jugador={{ ...jugador, nombre, emoji }} tamano="lg" torcido={false} />

        <input
          autoFocus
          value={nombre}
          maxLength={18}
          aria-label="Nombre"
          onChange={(evento) => setNombre(evento.target.value)}
          className="display h-12 min-w-[8rem] flex-1 rounded-md border-[3px] border-tinta bg-naranja-claro px-3 text-2xl text-tinta outline-none"
        />
      </div>

      <div>
        <p className="rotulo mb-2 text-tinta/50">Emoji</p>
        <div className="flex flex-wrap gap-1.5">
          {EMOJIS.map((candidato) => (
            <button
              key={candidato}
              type="button"
              onClick={() => setEmoji(candidato)}
              className={`flex size-10 items-center justify-center rounded-sm border-2 text-lg transition-colors duration-100 ${
                candidato === emoji
                  ? "border-tinta bg-naranja"
                  : "border-transparent hover:border-tinta hover:bg-hueso"
              }`}
            >
              {candidato}
            </button>
          ))}
        </div>
        <p className="mt-2 text-2xs font-bold text-tinta/45">
          El emoji se usa cuando el jugador no tiene foto cargada en el proyecto.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Boton type="submit" variante="naranja" disabled={!nombre.trim()}>
          <IconoCheck className="size-4" />
          Guardar
        </Boton>
        <Boton type="button" variante="fantasmaTinta" onClick={onCancelar}>
          Cancelar
        </Boton>
      </div>
    </motion.form>
  );
}
