"use client";

import { motion } from "motion/react";
import { useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { IconoBasura, IconoCheck } from "./Iconos";
import { Boton } from "./ui";
import { recortarFoto } from "@/lib/foto";
import { resorte } from "@/lib/motion";
import { EMOJIS, type Jugador } from "@/lib/types";

export function EditorJugador({
  jugador,
  onGuardar,
  onCancelar,
}: {
  jugador: Jugador;
  onGuardar: (cambios: Pick<Jugador, "nombre" | "emoji" | "foto">) => void;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(jugador.nombre);
  const [emoji, setEmoji] = useState(jugador.emoji);
  const [foto, setFoto] = useState(jugador.foto);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const archivoRef = useRef<HTMLInputElement>(null);

  async function elegirFoto(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!archivo) return;

    setError(null);
    setProcesando(true);
    try {
      setFoto(await recortarFoto(archivo));
    } catch (falla) {
      setError(falla instanceof Error ? falla.message : "No se pudo cargar la foto.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={resorte}
      onSubmit={(evento) => {
        evento.preventDefault();
        if (!nombre.trim()) return;
        onGuardar({ nombre, emoji, foto });
      }}
      className="flex w-full flex-col gap-4"
    >
      <div className="flex flex-wrap items-center gap-4">
        <Avatar jugador={{ ...jugador, nombre, emoji, foto }} tamano="lg" torcido={false} />

        <div className="flex flex-col gap-2">
          <Boton
            type="button"
            tamano="sm"
            variante="azul"
            disabled={procesando}
            onClick={() => archivoRef.current?.click()}
          >
            {procesando ? "Achicando…" : foto ? "Cambiar foto" : "Subir foto"}
          </Boton>

          {foto ? (
            <Boton type="button" tamano="sm" variante="peligro" onClick={() => setFoto(undefined)}>
              <IconoBasura className="size-3.5" />
              Sacar foto
            </Boton>
          ) : null}

          <input
            ref={archivoRef}
            type="file"
            accept="image/*"
            onChange={elegirFoto}
            className="hidden"
          />
        </div>

        <input
          autoFocus
          value={nombre}
          maxLength={18}
          aria-label="Nombre"
          onChange={(evento) => setNombre(evento.target.value)}
          className="display h-12 min-w-[8rem] flex-1 rounded-md border-[3px] border-tinta bg-naranja-claro px-3 text-2xl text-tinta outline-none"
        />
      </div>

      {foto ? (
        <p className="text-2xs font-bold text-tinta/50">
          Con foto puesta, el emoji queda de reserva: aparece si algún día la sacás.
        </p>
      ) : null}

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
      </div>

      {error ? <p className="text-xs font-bold text-naranja-hondo">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Boton type="submit" variante="naranja" disabled={!nombre.trim() || procesando}>
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
