"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Avatar } from "@/components/Avatar";
import {
  IconoBasura,
  IconoCheck,
  IconoDescargar,
  IconoImportar,
  IconoJugadores,
  IconoLapiz,
  IconoMas,
} from "@/components/Iconos";
import { Cargando, Encabezado, Pagina } from "@/components/Pagina";
import { Boton, Campo, ConfirmarEnLinea, TituloSeccion } from "@/components/ui";
import { EMOJIS } from "@/lib/types";
import { useLiga } from "@/lib/store";

function SelectorEmoji({
  valor,
  onCambio,
}: {
  valor: string;
  onCambio: (emoji: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((previo) => !previo)}
        aria-label="Elegir emoji"
        className="flex size-11 items-center justify-center rounded-md border border-[var(--borde)] bg-mesa-850 text-xl transition-colors duration-150 hover:border-[var(--borde-fuerte)]"
      >
        {valor}
      </button>

      <AnimatePresence>
        {abierto ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-13 z-20 grid w-[15.5rem] grid-cols-5 gap-1 rounded-md border border-[var(--borde-fuerte)] bg-mesa-850 p-2 shadow-[var(--sombra-media)]"
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onCambio(emoji);
                  setAbierto(false);
                }}
                className={`flex size-10 items-center justify-center rounded-sm text-lg transition-colors duration-150 ${
                  emoji === valor ? "bg-pelota/15" : "hover:bg-mesa-700"
                }`}
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function PaginaJugadores() {
  const {
    liga,
    estado,
    hidratado,
    agregarJugador,
    editarJugador,
    borrarJugador,
    exportar,
    importar,
    cargarDemo,
    vaciar,
  } = useLiga();

  const [nombre, setNombre] = useState("");
  const [emoji, setEmoji] = useState<string>(EMOJIS[0]);
  const [editando, setEditando] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const archivoRef = useRef<HTMLInputElement>(null);

  function sumarJugador(evento: React.FormEvent) {
    evento.preventDefault();
    if (!agregarJugador(nombre, emoji)) return;

    setNombre("");
    const usados = new Set(estado.jugadores.map((jugador) => jugador.emoji));
    usados.add(emoji);
    setEmoji(EMOJIS.find((candidato) => !usados.has(candidato)) ?? EMOJIS[0]);
  }

  function descargar() {
    const blob = new Blob([exportar()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `mesa-liga-${new Date().toISOString().slice(0, 10)}.json`;
    enlace.click();
    URL.revokeObjectURL(url);
    setAviso({ tipo: "ok", texto: "Archivo descargado. Pasáselo a quien quiera la liga." });
  }

  async function subir(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    const texto = await archivo.text();
    const resultado = importar(texto);
    setAviso(
      resultado.ok
        ? { tipo: "ok", texto: "Liga importada. Se reemplazaron los datos de este navegador." }
        : { tipo: "error", texto: resultado.error ?? "No se pudo importar." },
    );
    evento.target.value = "";
  }

  if (!hidratado) {
    return (
      <Pagina>
        <Encabezado etiqueta="El plantel" titulo="Jugadores" />
        <Cargando />
      </Pagina>
    );
  }

  return (
    <Pagina>
      <Encabezado
        etiqueta="El plantel"
        titulo="Jugadores"
        bajada="Cargá a cada uno una vez. Todos arrancan con 1000 puntos."
      />

      <form onSubmit={sumarJugador} className="mb-10 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <span className="etiqueta">Emoji</span>
          <SelectorEmoji valor={emoji} onCambio={setEmoji} />
        </div>

        <div className="min-w-[12rem] flex-1">
          <Campo
            etiqueta="Nombre"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            placeholder="Cómo le dicen"
            maxLength={20}
          />
        </div>

        <Boton type="submit" variante="primario" tamano="lg" disabled={!nombre.trim()}>
          <IconoMas className="size-4" />
          Agregar
        </Boton>
      </form>

      {liga.jugadores.length === 0 ? (
        <div className="panel mb-12 rounded-lg px-6 py-12 text-center">
          <IconoJugadores className="mx-auto mb-4 size-8 text-tiza-25" />
          <p className="text-sm text-tiza-45">
            Todavía no hay nadie. Sumá al menos dos para poder anotar un partido.
          </p>
        </div>
      ) : (
        <ul className="mb-14 flex flex-col gap-1.5">
          <AnimatePresence initial={false}>
            {liga.jugadores.map((jugador, indice) => {
              const stats = liga.stats[jugador.id];
              const fila = liga.tabla.find((candidata) => candidata.jugador.id === jugador.id);

              return (
                <motion.li
                  key={jugador.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
                  transition={{
                    duration: 0.3,
                    delay: Math.min(indice, 8) * 0.02,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="panel flex items-center gap-3 rounded-md px-3 py-2.5"
                >
                  <Avatar jugador={jugador} tamano="sm" />

                  {editando === jugador.id ? (
                    <form
                      className="flex flex-1 items-center gap-2"
                      onSubmit={(evento) => {
                        evento.preventDefault();
                        editarJugador(jugador.id, { nombre: nombreEditado });
                        setEditando(null);
                      }}
                    >
                      <input
                        autoFocus
                        value={nombreEditado}
                        maxLength={20}
                        onChange={(evento) => setNombreEditado(evento.target.value)}
                        className="h-9 flex-1 rounded-sm border border-pelota/50 bg-mesa-800 px-2.5 text-base text-tiza outline-none"
                      />
                      <button
                        type="submit"
                        aria-label="Guardar nombre"
                        className="rounded-xs p-1.5 text-gana transition-opacity hover:opacity-70"
                      >
                        <IconoCheck className="size-4" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <Link
                        href={`/jugador/${jugador.id}`}
                        className="flex-1 truncate text-base text-tiza transition-colors duration-150 hover:text-pelota"
                      >
                        {jugador.nombre}
                      </Link>

                      <span className="hidden font-mono text-2xs text-tiza-25 sm:block">
                        {stats && stats.pj > 0
                          ? `${fila ? `#${fila.puesto} · ` : ""}${stats.pj} PJ`
                          : "sin partidos"}
                      </span>
                      <span className="w-14 text-right font-mono text-sm tabular-nums text-tiza-70">
                        {stats?.elo ?? 1000}
                      </span>

                      <button
                        onClick={() => {
                          setEditando(jugador.id);
                          setNombreEditado(jugador.nombre);
                        }}
                        aria-label={`Renombrar a ${jugador.nombre}`}
                        className="rounded-xs p-1.5 text-tiza-25 transition-colors duration-150 hover:text-tiza"
                      >
                        <IconoLapiz className="size-4" />
                      </button>

                      <ConfirmarEnLinea
                        onConfirmar={() => borrarJugador(jugador.id)}
                        pregunta={
                          stats && stats.pj > 0 ? `Se borran sus ${stats.pj} partidos` : "¿Seguro?"
                        }
                      >
                        {(abrir) => (
                          <button
                            onClick={abrir}
                            aria-label={`Borrar a ${jugador.nombre}`}
                            className="rounded-xs p-1.5 text-tiza-25 transition-colors duration-150 hover:text-pierde"
                          >
                            <IconoBasura className="size-4" />
                          </button>
                        )}
                      </ConfirmarEnLinea>
                    </>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <section className="border-t border-[var(--borde)] pt-10">
        <TituloSeccion
          etiqueta="Respaldo"
          titulo="Los datos son tuyos"
        />
        <p className="mb-5 max-w-[62ch] text-sm leading-relaxed text-tiza-45">
          La liga vive en este navegador: no hay cuentas ni servidor. Descargá el archivo para
          tener una copia o para que otro la abra en su celular.
        </p>

        <div className="flex flex-wrap gap-2">
          <Boton onClick={descargar} disabled={liga.jugadores.length === 0}>
            <IconoDescargar className="size-4" />
            Descargar liga
          </Boton>

          <Boton onClick={() => archivoRef.current?.click()}>
            <IconoImportar className="size-4" />
            Importar archivo
          </Boton>
          <input
            ref={archivoRef}
            type="file"
            accept="application/json,.json"
            onChange={subir}
            className="hidden"
          />

          {liga.jugadores.length === 0 ? (
            <Boton variante="fantasma" onClick={cargarDemo}>
              Cargar datos de ejemplo
            </Boton>
          ) : (
            <ConfirmarEnLinea
              onConfirmar={vaciar}
              pregunta="Se borra todo"
              textoConfirmar="Borrar todo"
            >
              {(abrir) => (
                <Boton variante="peligro" onClick={abrir}>
                  Empezar de cero
                </Boton>
              )}
            </ConfirmarEnLinea>
          )}
        </div>

        <AnimatePresence>
          {aviso ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`mt-4 text-sm ${aviso.tipo === "ok" ? "text-gana" : "text-pierde"}`}
            >
              {aviso.texto}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </section>
    </Pagina>
  );
}
