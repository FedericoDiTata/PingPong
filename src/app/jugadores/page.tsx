"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Avatar } from "@/components/Avatar";
import { EditorJugador } from "@/components/EditorJugador";
import {
  IconoBasura,
  IconoDescargar,
  IconoImportar,
  IconoLapiz,
  IconoMas,
} from "@/components/Iconos";
import { Cargando, Encabezado, Pagina } from "@/components/Pagina";
import { Boton, Campo, ConfirmarEnLinea, TituloSeccion } from "@/components/ui";
import { nombreDelEntorno } from "@/lib/despliegue";
import { escalonar, golpe, resorte } from "@/lib/motion";
import { useLiga } from "@/lib/store";
import { EMOJIS } from "@/lib/types";

function SelectorEmoji({ valor, onCambio }: { valor: string; onCambio: (emoji: string) => void }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((previo) => !previo)}
        aria-label="Elegir emoji"
        className="flex size-13 items-center justify-center rounded-md border-[3px] border-tinta bg-crema text-2xl shadow-[var(--golpe-chico)] transition-colors duration-100 hover:bg-naranja-claro"
      >
        {valor}
      </button>

      <AnimatePresence>
        {abierto ? (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={golpe}
            className="absolute left-0 top-16 z-20 grid w-[17rem] grid-cols-5 gap-1.5 rounded-md border-[3px] border-tinta bg-crema p-2.5 shadow-[var(--golpe)]"
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onCambio(emoji);
                  setAbierto(false);
                }}
                className={`flex size-11 items-center justify-center rounded-sm border-2 text-xl transition-colors duration-100 ${
                  emoji === valor
                    ? "border-tinta bg-naranja"
                    : "border-transparent hover:border-tinta hover:bg-hueso"
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
    vaciar,
    compartida,
  } = useLiga();

  const [nombre, setNombre] = useState("");
  const [emoji, setEmoji] = useState<string>(EMOJIS[0]);
  const [editando, setEditando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const archivoRef = useRef<HTMLInputElement>(null);

  function sumarJugador(evento: React.FormEvent) {
    evento.preventDefault();
    if (!agregarJugador(nombre, emoji)) return;

    setNombre("");
    const usados = new Set(estado.jugadores.map((jugador) => jugador.emoji));
    usados.add(emoji);
    setEmoji(EMOJIS.find((candidato) => !usados.has(candidato)) ?? EMOJIS[0]);
    navigator.vibrate?.(12);
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

    const resultado = importar(await archivo.text());
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
        <Encabezado rotulo="El plantel" titulo="Jugadores" />
        <Cargando />
      </Pagina>
    );
  }

  return (
    <Pagina>
      <Encabezado
        rotulo="El plantel"
        titulo="Jugadores"
        bajada="Cargá a cada uno una sola vez. Los que entran arrancan en nivel 50, el del jugador promedio."
      />

      <form onSubmit={sumarJugador} className="mb-12 flex flex-wrap items-end gap-3">
        <SelectorEmoji valor={emoji} onCambio={setEmoji} />

        <div className="min-w-[12rem] flex-1">
          <Campo
            etiqueta="Nombre"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            placeholder="Cómo le dicen"
            maxLength={18}
          />
        </div>

        <Boton type="submit" variante="naranja" tamano="lg" disabled={!nombre.trim()}>
          <IconoMas className="size-5" />
          Agregar
        </Boton>
      </form>

      {liga.jugadores.length === 0 ? (
        <div className="cartel mb-14 rounded-lg px-6 py-12 text-center">
          <p className="display text-2xl text-tinta">Todavía no hay nadie</p>
          <p className="mt-2 text-sm font-bold text-tinta/60">
            Sumá al menos dos para poder anotar un partido.
          </p>
        </div>
      ) : (
        <ul className="mb-16 flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {liga.jugadores.map((jugador, indice) => {
              const stats = liga.stats[jugador.id];
              const fila = liga.tabla.find((candidata) => candidata.jugador.id === jugador.id);

              return (
                <motion.li
                  key={jugador.id}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                  transition={{ ...resorte, delay: escalonar(indice, 0.03) }}
                  className="cartel flex flex-wrap items-center gap-3 rounded-md px-3 py-3"
                >
                  {editando === jugador.id ? (
                    <EditorJugador
                      jugador={jugador}
                      onCancelar={() => setEditando(null)}
                      onGuardar={(cambios) => {
                        editarJugador(jugador.id, cambios);
                        setEditando(null);
                      }}
                    />
                  ) : (
                    <>
                      <Avatar jugador={jugador} tamano="sm" />
                      <Link
                        href={`/jugador/${jugador.id}`}
                        className="display min-w-[5.5rem] flex-1 truncate text-2xl text-tinta hover:text-naranja-hondo"
                      >
                        {jugador.nombre}
                      </Link>

                      {/* En pantallas angostas el nombre gana: estos números ya
                          están en el ranking, el nombre no está en ningún lado. */}
                      <span className="display hidden text-lg text-tinta/60 sm:block">
                        {stats && stats.pj > 0 ? (
                          <>
                            {fila ? `#${fila.puesto} · ` : ""}
                            {stats.pg}G · {stats.pp}P
                          </>
                        ) : (
                          <span className="rotulo text-tinta/40">sin partidos</span>
                        )}
                      </span>

                      <span className="display w-16 text-right text-2xl text-tinta">
                        {(stats?.nivel ?? 50).toFixed(1).replace(".", ",")}
                      </span>

                      <button
                        onClick={() => setEditando(jugador.id)}
                        aria-label={`Editar a ${jugador.nombre}`}
                        className="rounded-sm p-1.5 text-tinta/35 transition-colors duration-100 hover:text-tinta"
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
                            className="rounded-sm p-1.5 text-tinta/35 transition-colors duration-100 hover:text-naranja-hondo"
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

      <section className="border-t-[3px] border-tinta pt-10">
        <TituloSeccion rotulo="Respaldo" titulo="Los datos son tuyos" />
        <p className="mb-4 max-w-[62ch] text-sm font-medium leading-relaxed text-crema/65">
          {compartida ? (
            <>
              La liga es una sola para todos: vive en la base de datos y se sincroniza sola entre
              los teléfonos. Igual podés descargarte una copia cuando quieras.
            </>
          ) : (
            <>
              La liga vive en este navegador: no hay cuentas ni servidor. Descargá el archivo para
              tener una copia o para que otro la abra en su celular.
            </>
          )}
        </p>

        {/* Sin base compartida la dirección importa: el navegador guarda por
            dirección exacta, así que otro puerto u otra URL son otra app. */}
        <p className="mb-6 max-w-[62ch] text-2xs font-bold uppercase tracking-[0.1em] text-crema/40">
          {compartida
            ? "Liga compartida · sincronizada entre todos"
            : `Guardando en ${typeof window === "undefined" ? "este navegador" : window.location.host} · ${nombreDelEntorno}`}
        </p>

        <div className="flex flex-wrap gap-3">
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

          {liga.jugadores.length > 0 ? (
            <ConfirmarEnLinea
              onConfirmar={vaciar}
              pregunta={`Se borran ${liga.totalPartidos} partidos`}
              textoConfirmar="Borrar todo"
            >
              {(abrir) => (
                <Boton variante="peligro" onClick={abrir}>
                  Empezar de cero
                </Boton>
              )}
            </ConfirmarEnLinea>
          ) : null}
        </div>

        <AnimatePresence>
          {aviso ? (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={golpe}
              className={`mt-5 inline-block rounded-sm border-[3px] border-tinta px-3 py-2 text-xs font-bold ${
                aviso.tipo === "ok" ? "bg-naranja text-tinta" : "bg-crema text-tinta"
              }`}
            >
              {aviso.texto}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </section>
    </Pagina>
  );
}
