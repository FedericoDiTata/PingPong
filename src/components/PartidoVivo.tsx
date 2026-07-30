"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { NumeroRodante } from "./NumeroRodante";
import { Boton } from "./ui";
import { IconoCerrar, IconoDeshacer } from "./Iconos";
import { tonoJugador, type TonoJugador } from "@/lib/color";
import { conSigno } from "@/lib/format";
import type { Liga } from "@/lib/liga";
import type { Game, Jugador } from "@/lib/types";
import { reconstruir, type Lado } from "@/lib/vivo";

export type ConfigVivo = {
  a: string;
  b: string;
  meta: number;
  alMejorDe: number;
  saque: Lado;
};

type Onda = { x: number; y: number; clave: number };

/* --------------------------------------------------------------- Mitad --- */

function Mitad({
  jugador,
  tono,
  puntos,
  sets,
  setsNecesarios,
  saca,
  puntoDeGame,
  puntoDePartido,
  onPunto,
}: {
  jugador: Jugador;
  tono: TonoJugador;
  puntos: number;
  sets: number;
  setsNecesarios: number;
  saca: boolean;
  puntoDeGame: boolean;
  puntoDePartido: boolean;
  onPunto: (x: number, y: number) => void;
}) {
  const reducido = useReducedMotion();
  const [ondas, setOndas] = useState<Onda[]>([]);

  function alTocar(evento: React.PointerEvent<HTMLButtonElement>) {
    const caja = evento.currentTarget.getBoundingClientRect();
    const x = evento.clientX - caja.left;
    const y = evento.clientY - caja.top;

    if (!reducido) {
      const clave = Date.now();
      setOndas((previas) => [...previas.slice(-2), { x, y, clave }]);
      window.setTimeout(() => {
        setOndas((previas) => previas.filter((onda) => onda.clave !== clave));
      }, 620);
    }

    onPunto(x, y);
  }

  return (
    <button
      onPointerDown={alTocar}
      aria-label={`Sumar un punto a ${jugador.nombre}`}
      className="relative flex flex-1 select-none flex-col items-center justify-center overflow-hidden outline-none"
      style={{ backgroundColor: tono.tenue }}
    >
      {ondas.map((onda) => (
        <motion.span
          key={onda.clave}
          aria-hidden
          initial={{ scale: 0, opacity: 0.32 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute size-[70vmax] rounded-full"
          style={{
            left: onda.x,
            top: onda.y,
            marginLeft: "-35vmax",
            marginTop: "-35vmax",
            backgroundColor: tono.fuerte,
          }}
        />
      ))}

      {/* Anillo de punto de game o de partido */}
      <AnimatePresence>
        {puntoDeGame ? (
          <motion.span
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: `inset 0 0 0 2px var(--color-pelota), inset 0 0 60px -18px var(--color-pelota)`,
            }}
          />
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-none absolute top-5 flex items-center gap-2.5 px-4 md:top-8">
        <Avatar jugador={jugador} tamano="sm" />
        <span className="max-w-[40vw] truncate text-base font-semibold text-tiza md:text-lg">
          {jugador.nombre}
        </span>
        {saca ? (
          <span className="relative flex size-2.5 items-center justify-center" title="Saca">
            <span className="absolute size-2.5 rounded-full bg-pelota/40 animate-latido" />
            <span className="size-2 rounded-full bg-pelota" />
          </span>
        ) : null}
      </div>

      <NumeroRodante
        valor={puntos}
        className="pointer-events-none font-mono text-[clamp(4.5rem,23vw,10rem)] font-medium leading-none text-tiza"
      />

      <AnimatePresence>
        {puntoDeGame ? (
          <motion.span
            key={puntoDePartido ? "partido" : "game"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute bottom-16 font-mono text-2xs uppercase tracking-[0.22em] text-pelota md:bottom-20"
          >
            {puntoDePartido ? "punto de partido" : "punto de game"}
          </motion.span>
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-none absolute bottom-5 flex items-center gap-1.5 md:bottom-8">
        {Array.from({ length: setsNecesarios }).map((_, indice) => (
          <span
            key={indice}
            className={`block size-2 rounded-full transition-colors duration-300 ${
              indice < sets ? "bg-pelota" : "bg-tiza/15"
            }`}
          />
        ))}
      </div>
    </button>
  );
}

/* ------------------------------------------------------------- Partido --- */

export function PartidoVivo({
  liga,
  config,
  onSalir,
  onGuardar,
  onBorrar,
  onRevancha,
}: {
  liga: Liga;
  config: ConfigVivo;
  onSalir: () => void;
  onGuardar: (games: Game[]) => string;
  onBorrar: (id: string) => void;
  onRevancha: () => void;
}) {
  const [puntos, setPuntos] = useState<Lado[]>([]);
  const [idGuardado, setIdGuardado] = useState<string | null>(null);
  const [avisoGame, setAvisoGame] = useState<{ texto: string; marcador: string } | null>(null);
  const temporizadorAviso = useRef<number | undefined>(undefined);

  const jugadorA = liga.porId[config.a];
  const jugadorB = liga.porId[config.b];

  const estado = reconstruir(puntos, config.meta, config.alMejorDe, config.saque);

  // Todo lo que pasa al sumar un punto se decide acá, en el evento: guardar el
  // partido cuando se cierra y mostrar el cartel de game. Nada de efectos
  // reaccionando a un estado que ya podemos calcular en el momento.
  const sumar = useCallback(
    (lado: Lado) => {
      if (estado.terminado) return;

      navigator.vibrate?.(8);
      const siguientes = [...puntos, lado];
      const proximo = reconstruir(siguientes, config.meta, config.alMejorDe, config.saque);
      setPuntos(siguientes);

      if (proximo.terminado) {
        if (!idGuardado) setIdGuardado(onGuardar(proximo.games));
        return;
      }

      const cerroGame = proximo.games.length > estado.games.length;
      if (!cerroGame) return;

      const game = proximo.games[proximo.games.length - 1];
      const ganador = game.a > game.b ? jugadorA : jugadorB;
      setAvisoGame({
        texto: `Game para ${ganador?.nombre ?? ""}`,
        marcador: `${game.a} - ${game.b}`,
      });

      window.clearTimeout(temporizadorAviso.current);
      temporizadorAviso.current = window.setTimeout(() => setAvisoGame(null), 1700);
    },
    [estado, puntos, config, idGuardado, onGuardar, jugadorA, jugadorB],
  );

  const deshacer = useCallback(() => {
    setPuntos((previos) => previos.slice(0, -1));
    window.clearTimeout(temporizadorAviso.current);
    setAvisoGame(null);
  }, []);

  useEffect(() => () => window.clearTimeout(temporizadorAviso.current), []);

  // La pantalla no se apaga en medio de un partido
  useEffect(() => {
    let liberar: WakeLockSentinel | null = null;
    let cancelado = false;

    navigator.wakeLock
      ?.request("screen")
      .then((bloqueo) => {
        if (cancelado) void bloqueo.release();
        else liberar = bloqueo;
      })
      .catch(() => {
        /* el navegador no lo soporta: seguimos igual */
      });

    return () => {
      cancelado = true;
      void liberar?.release();
    };
  }, []);

  // Teclado en escritorio
  useEffect(() => {
    function alPresionar(evento: KeyboardEvent) {
      if (evento.key === "ArrowLeft") sumar("a");
      else if (evento.key === "ArrowRight") sumar("b");
      else if (evento.key === "Backspace") {
        evento.preventDefault();
        deshacer();
      }
    }
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [sumar, deshacer]);

  if (!jugadorA || !jugadorB) return null;

  const tonoA = tonoJugador(jugadorA.id);
  const tonoB = tonoJugador(jugadorB.id);
  const necesarios = Math.ceil(config.alMejorDe / 2);

  /* ------------------------------------------------------------ Final --- */

  if (estado.terminado) {
    const ganador = estado.ganador === "a" ? jugadorA : jugadorB;
    const perdedor = estado.ganador === "a" ? jugadorB : jugadorA;
    const tonoGanador = estado.ganador === "a" ? tonoA : tonoB;
    const guardado = idGuardado
      ? liga.resultados.find((resultado) => resultado.partido.id === idGuardado)
      : undefined;

    const deltaGanador = guardado
      ? estado.ganador === "a"
        ? guardado.delta.a
        : guardado.delta.b
      : 0;
    const deltaPerdedor = guardado
      ? estado.ganador === "a"
        ? guardado.delta.b
        : guardado.delta.a
      : 0;

    return (
      <div className="grano fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-mesa-950 px-6 py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(80% 50% at 50% 30%, ${tonoGanador.tenue}, transparent 70%)`,
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex w-full max-w-md flex-col items-center gap-6"
        >
          <span className="etiqueta">Partido terminado</span>

          <motion.div
            initial={{ scale: 0.86 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <span
              aria-hidden
              className="absolute inset-0 rounded-md animate-latido"
              style={{ backgroundColor: tonoGanador.borde }}
            />
            <Avatar jugador={ganador} tamano="xl" className="relative" />
          </motion.div>

          <div className="flex flex-col items-center gap-1.5 text-center">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-tiza">
              Ganó {ganador.nombre}
            </h2>
            <p className="font-mono text-lg tabular-nums text-pelota">
              {Math.max(estado.setsA, estado.setsB)} — {Math.min(estado.setsA, estado.setsB)}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 font-mono text-sm text-tiza-45">
            {estado.games.map((game, indice) => (
              <span key={indice}>
                {game.a}-{game.b}
              </span>
            ))}
          </div>

          <div className="w-full border-t border-[var(--borde)] pt-5">
            <p className="etiqueta mb-3 text-center">Movimiento de puntaje</p>
            <div className="flex flex-col gap-2">
              {[
                { jugador: ganador, delta: deltaGanador },
                { jugador: perdedor, delta: deltaPerdedor },
              ].map(({ jugador, delta }) => (
                <div
                  key={jugador.id}
                  className="flex items-center gap-3 rounded-md bg-mesa-900 px-3 py-2.5"
                >
                  <Avatar jugador={jugador} tamano="xs" />
                  <span className="flex-1 truncate text-sm text-tiza-70">{jugador.nombre}</span>
                  <span className="font-mono text-sm tabular-nums text-tiza">
                    {liga.stats[jugador.id]?.elo ?? 1000}
                  </span>
                  <span
                    className={`w-12 text-right font-mono text-sm ${
                      delta >= 0 ? "text-gana" : "text-pierde"
                    }`}
                  >
                    {conSigno(delta)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 pt-2">
            <Boton
              variante="primario"
              tamano="lg"
              onClick={() => {
                setPuntos([]);
                setIdGuardado(null);
                onRevancha();
              }}
            >
              Revancha
            </Boton>
            <div className="flex gap-2">
              <Link href="/" className="flex-1">
                <Boton variante="secundario" className="w-full">
                  Ver ranking
                </Boton>
              </Link>
              <Boton
                variante="fantasma"
                onClick={() => {
                  if (idGuardado) onBorrar(idGuardado);
                  onSalir();
                }}
              >
                Descartar
              </Boton>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ---------------------------------------------------------- Jugando --- */

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-mesa-950">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--borde)] px-2">
        <button
          onClick={onSalir}
          aria-label="Salir del partido"
          className="rounded-sm p-2.5 text-tiza-45 transition-colors duration-150 hover:text-tiza"
        >
          <IconoCerrar className="size-5" />
        </button>

        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="etiqueta">
            Game {estado.numeroGame} · al mejor de {config.alMejorDe}
          </span>
          <span className="font-mono text-sm tabular-nums text-tiza-70">
            {estado.setsA} — {estado.setsB}
          </span>
        </div>

        <button
          onClick={deshacer}
          disabled={puntos.length === 0}
          aria-label="Deshacer último punto"
          className="rounded-sm p-2.5 text-tiza-45 transition-colors duration-150 hover:text-tiza disabled:opacity-25"
        >
          <IconoDeshacer className="size-5" />
        </button>
      </header>

      <div className="relative flex flex-1 flex-col md:flex-row">
        <Mitad
          jugador={jugadorA}
          tono={tonoA}
          puntos={estado.actual.a}
          sets={estado.setsA}
          setsNecesarios={necesarios}
          saca={estado.saca === "a"}
          puntoDeGame={estado.puntoDeGame === "a"}
          puntoDePartido={estado.puntoDePartido === "a"}
          onPunto={() => sumar("a")}
        />

        {/* La red */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-px -translate-y-1/2 md:hidden"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, color-mix(in oklch, var(--color-tiza) 26%, transparent) 0 6px, transparent 6px 11px)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 z-10 hidden w-px -translate-x-1/2 md:block"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, color-mix(in oklch, var(--color-tiza) 26%, transparent) 0 6px, transparent 6px 11px)",
          }}
        />

        <AnimatePresence>
          {estado.deuce ? (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--borde-pelota)] bg-mesa-950 px-3.5 py-1.5 font-mono text-2xs uppercase tracking-[0.2em] text-pelota"
            >
              deuce
            </motion.span>
          ) : null}
        </AnimatePresence>

        <Mitad
          jugador={jugadorB}
          tono={tonoB}
          puntos={estado.actual.b}
          sets={estado.setsB}
          setsNecesarios={necesarios}
          saca={estado.saca === "b"}
          puntoDeGame={estado.puntoDeGame === "b"}
          puntoDePartido={estado.puntoDePartido === "b"}
          onPunto={() => sumar("b")}
        />

        <AnimatePresence>
          {avisoGame ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-md border border-[var(--borde-fuerte)] bg-mesa-950/95 px-6 py-4 text-center shadow-[var(--sombra-alta)]"
            >
              <span className="text-base font-semibold text-tiza">{avisoGame.texto}</span>
              <span className="font-mono text-sm tabular-nums text-pelota">
                {avisoGame.marcador}
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
