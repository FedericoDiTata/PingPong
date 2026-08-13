"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { Explosion } from "./Explosion";
import { IconoCheck, IconoDeshacer, IconoMas } from "./Iconos";
import { Boton } from "./ui";
import { tonoJugador } from "@/lib/color";
import type { Liga } from "@/lib/liga";
import { escalonar, golpe, resorte, resorteFirme } from "@/lib/motion";
import { META, type Jugador, type Partido } from "@/lib/types";

type Cargado = { partido: Partido; ganador: Jugador; perdedor: Jugador };

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function ayerISO() {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
}

/* -------------------------------------------------------------- Bloques --- */

function Paso({
  numero,
  titulo,
  children,
  activo = true,
}: {
  numero: number;
  titulo: string;
  children: React.ReactNode;
  activo?: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: activo ? 1 : 0.4, y: 0 }}
      transition={{ ...resorteFirme, delay: numero * 0.05 }}
      className={activo ? "" : "pointer-events-none"}
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="display flex size-9 shrink-0 -rotate-3 items-center justify-center rounded-sm border-[3px] border-tinta bg-crema text-lg text-tinta shadow-[var(--golpe-chico)]">
          {numero}
        </span>
        <h2 className="display text-xl text-crema md:text-2xl">{titulo}</h2>
      </div>
      {children}
    </motion.section>
  );
}

/* ------------------------------------------------------------ Componente --- */

export function CargarResultado({
  liga,
  onGuardar,
  onBorrar,
}: {
  liga: Liga;
  onGuardar: (partido: Omit<Partido, "id">) => Partido;
  onBorrar: (id: string) => void;
}) {
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [ganador, setGanador] = useState<string | null>(null);
  const [verMarcador, setVerMarcador] = useState(false);
  const [puntosPerdedor, setPuntosPerdedor] = useState<number | null>(null);
  const [puntosGanador, setPuntosGanador] = useState(META);
  const [deuce, setDeuce] = useState(false);
  const [fecha, setFecha] = useState(hoyISO);
  const [cargados, setCargados] = useState<Cargado[]>([]);
  const [explosion, setExplosion] = useState<number | null>(null);

  function alternarJugador(id: string) {
    setSeleccion((previa) => {
      if (previa.includes(id)) {
        if (ganador === id) setGanador(null);
        return previa.filter((otro) => otro !== id);
      }
      if (previa.length < 2) return [...previa, id];
      // Con dos ya elegidos, el nuevo reemplaza al primero.
      if (ganador === previa[0]) setGanador(null);
      return [previa[1], id];
    });
  }

  function limpiar(mantenerPareja = false) {
    if (!mantenerPareja) setSeleccion([]);
    setGanador(null);
    setVerMarcador(false);
    setPuntosPerdedor(null);
    setPuntosGanador(META);
    setDeuce(false);
  }

  const marcadorValido =
    !verMarcador ||
    (puntosPerdedor !== null &&
      puntosGanador > puntosPerdedor &&
      puntosGanador >= META &&
      puntosGanador - puntosPerdedor >= 2);

  const puedeGuardar = seleccion.length === 2 && Boolean(ganador) && marcadorValido;

  function guardar() {
    if (!puedeGuardar || !ganador) return;

    const [a, b] = seleccion;
    const ahora = new Date();
    const cuando = new Date(`${fecha}T00:00:00`);
    cuando.setHours(
      ahora.getHours(),
      ahora.getMinutes(),
      ahora.getSeconds(),
      ahora.getMilliseconds(),
    );

    const ganoA = ganador === a;
    const conMarcador = verMarcador && puntosPerdedor !== null;

    const partido = onGuardar({
      jugadorA: a,
      jugadorB: b,
      ganador,
      jugadoEn: cuando.toISOString(),
      ...(conMarcador
        ? {
            puntosA: ganoA ? puntosGanador : puntosPerdedor,
            puntosB: ganoA ? puntosPerdedor : puntosGanador,
          }
        : {}),
    });

    const jugadorGanador = liga.porId[ganador];
    const jugadorPerdedor = liga.porId[ganoA ? b : a];
    if (jugadorGanador && jugadorPerdedor) {
      setCargados((previos) =>
        [{ partido, ganador: jugadorGanador, perdedor: jugadorPerdedor }, ...previos].slice(0, 8),
      );
    }

    navigator.vibrate?.([14, 40, 22]);
    setExplosion(Date.now());
    window.setTimeout(() => setExplosion(null), 1100);
    limpiar();
  }

  function deshacer(id: string) {
    onBorrar(id);
    setCargados((previos) => previos.filter((item) => item.partido.id !== id));
  }

  const elegidos = seleccion.map((id) => liga.porId[id]).filter(Boolean);

  return (
    <div className="relative flex flex-col gap-12">
      {/* ------------------------------------------------ 1 · quiénes --- */}
      <Paso numero={1} titulo="¿Quiénes jugaron?">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {liga.jugadores.map((jugador, indice) => {
            const posicion = seleccion.indexOf(jugador.id);
            const elegido = posicion >= 0;
            const stats = liga.stats[jugador.id];

            return (
              <motion.button
                key={jugador.id}
                onClick={() => alternarJugador(jugador.id)}
                initial={{ opacity: 0, scale: 0.8, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ ...resorte, delay: escalonar(indice, 0.035) }}
                whileTap={{ scale: 0.94 }}
                className={`relative flex items-center gap-3 rounded-md border-[3px] border-tinta px-3 py-3 text-left transition-colors duration-100 ${
                  elegido
                    ? "bg-naranja text-tinta shadow-[var(--golpe)]"
                    : "bg-crema text-tinta shadow-[var(--golpe-chico)] hover:bg-hueso"
                }`}
              >
                <Avatar jugador={jugador} tamano="xs" torcido={false} />
                <span className="min-w-0 flex-1">
                  <span className="display block truncate text-lg leading-none">
                    {jugador.nombre}
                  </span>
                  <span className="text-2xs font-bold text-tinta/55">{stats?.puntos ?? 0} pts</span>
                </span>

                <AnimatePresence>
                  {elegido ? (
                    <motion.span
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: -8 }}
                      exit={{ scale: 0 }}
                      transition={golpe}
                      className="display absolute -right-2 -top-3 flex size-7 items-center justify-center rounded-full border-[3px] border-tinta bg-crema text-xs text-tinta"
                    >
                      {posicion + 1}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </Paso>

      {/* -------------------------------------------------- 2 · ganó --- */}
      <Paso numero={2} titulo="¿Quién ganó?" activo={seleccion.length === 2}>
        {elegidos.length === 2 ? (
          <div className="relative grid grid-cols-2 gap-3">
            {elegidos.map((jugador) => {
              const gano = ganador === jugador.id;
              const tono = tonoJugador(jugador.id);

              return (
                <motion.button
                  key={jugador.id}
                  onClick={() => setGanador(gano ? null : jugador.id)}
                  whileTap={{ scale: 0.95 }}
                  animate={
                    gano
                      ? { scale: 1, rotate: tono.inclinacion / 3 }
                      : { scale: 0.97, rotate: 0, opacity: ganador ? 0.55 : 1 }
                  }
                  transition={resorte}
                  className={`relative flex min-h-[11rem] flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border-[3px] border-tinta px-3 py-6 ${
                    gano
                      ? "bg-naranja shadow-[var(--golpe-grande)]"
                      : "bg-azul-800 shadow-[var(--golpe)]"
                  }`}
                >
                  <Avatar jugador={jugador} tamano="lg" />
                  <span
                    className={`display max-w-full break-words text-center text-2xl leading-none ${
                      gano ? "text-tinta" : "text-crema"
                    }`}
                  >
                    {jugador.nombre}
                  </span>

                  <AnimatePresence>
                    {gano ? (
                      <motion.span
                        initial={{ scale: 0, rotate: -18, opacity: 0 }}
                        animate={{ scale: 1, rotate: -3, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={golpe}
                        className="display rounded-sm border-2 border-tinta bg-crema px-3 py-1 text-lg text-tinta"
                      >
                        Ganó
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </motion.button>
              );
            })}

            <span className="display pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-tinta bg-crema px-3 py-1 text-lg text-tinta">
              vs
            </span>
          </div>
        ) : (
          <p className="text-sm font-semibold text-crema/50">
            Elegí dos jugadores arriba y acá aparecen para marcar el ganador.
          </p>
        )}
      </Paso>

      {/* ---------------------------------------------- 3 · marcador --- */}
      <Paso numero={3} titulo="¿Cuánto salió?" activo={Boolean(ganador)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Boton
              variante={verMarcador ? "naranja" : "fantasma"}
              onClick={() => {
                setVerMarcador((previo) => !previo);
                setPuntosPerdedor(null);
                setDeuce(false);
                setPuntosGanador(META);
              }}
            >
              {verMarcador ? "Sin marcador" : "Agregar marcador"}
            </Boton>
            <span className="text-2xs font-bold uppercase tracking-[0.12em] text-crema/45">
              Opcional · con saber quién ganó alcanza
            </span>
          </div>

          <AnimatePresence initial={false}>
            {verMarcador ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="cartel rounded-lg p-4 md:p-5">
                  <p className="rotulo mb-4 text-tinta/60">¿Cuántos puntos hizo el que perdió?</p>

                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 10 }, (_, numero) => {
                      const activo = !deuce && puntosPerdedor === numero;
                      return (
                        <motion.button
                          key={numero}
                          whileTap={{ scale: 0.88 }}
                          onClick={() => {
                            setDeuce(false);
                            setPuntosGanador(META);
                            setPuntosPerdedor(numero);
                          }}
                          className={`display size-12 rounded-sm border-[3px] border-tinta text-xl transition-colors duration-100 ${
                            activo
                              ? "bg-naranja text-tinta shadow-[var(--golpe-chico)]"
                              : "bg-azul-800 text-crema hover:bg-azul-700"
                          }`}
                        >
                          {numero}
                        </motion.button>
                      );
                    })}

                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setDeuce(true);
                        setPuntosGanador(12);
                        setPuntosPerdedor(10);
                      }}
                      className={`display h-12 rounded-sm border-[3px] border-tinta px-4 text-lg transition-colors duration-100 ${
                        deuce
                          ? "bg-naranja text-tinta shadow-[var(--golpe-chico)]"
                          : "bg-azul-800 text-crema hover:bg-azul-700"
                      }`}
                    >
                      Deuce
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {deuce ? (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-5 flex items-end gap-3"
                      >
                        <label className="flex flex-col gap-1.5">
                          <span className="rotulo text-tinta/60">Ganador</span>
                          <input
                            inputMode="numeric"
                            value={puntosGanador}
                            onChange={(evento) =>
                              setPuntosGanador(Number(evento.target.value.replace(/\D/g, "")) || 0)
                            }
                            className="display h-16 w-24 rounded-md border-[3px] border-tinta bg-naranja text-center text-3xl text-tinta outline-none"
                          />
                        </label>
                        <span className="display pb-5 text-2xl text-tinta/40">–</span>
                        <label className="flex flex-col gap-1.5">
                          <span className="rotulo text-tinta/60">Perdedor</span>
                          <input
                            inputMode="numeric"
                            value={puntosPerdedor ?? ""}
                            onChange={(evento) =>
                              setPuntosPerdedor(Number(evento.target.value.replace(/\D/g, "")) || 0)
                            }
                            className="display h-16 w-24 rounded-md border-[3px] border-tinta bg-crema text-center text-3xl text-tinta outline-none"
                          />
                        </label>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {puntosPerdedor !== null ? (
                    <motion.p
                      key={`${puntosGanador}-${puntosPerdedor}`}
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={golpe}
                      className="display mt-5 text-3xl text-tinta"
                    >
                      {puntosGanador} – {puntosPerdedor}
                      {!marcadorValido ? (
                        <span className="ml-3 align-middle text-sm text-naranja-hondo">
                          se gana por dos de diferencia
                        </span>
                      ) : null}
                    </motion.p>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rotulo mr-1 text-crema/45">Cuándo</span>
            {[
              { valor: hoyISO(), texto: "Hoy" },
              { valor: ayerISO(), texto: "Ayer" },
            ].map((opcion) => (
              <button
                key={opcion.texto}
                onClick={() => setFecha(opcion.valor)}
                className={`rounded-sm border-[3px] border-tinta px-3 py-2 text-2xs font-bold uppercase tracking-[0.1em] transition-colors duration-100 ${
                  fecha === opcion.valor
                    ? "bg-naranja text-tinta"
                    : "bg-azul-800 text-crema/70 hover:text-crema"
                }`}
              >
                {opcion.texto}
              </button>
            ))}
            <input
              type="date"
              value={fecha}
              max={hoyISO()}
              onChange={(evento) => setFecha(evento.target.value)}
              className="h-10 rounded-sm border-[3px] border-tinta bg-azul-800 px-2 text-xs font-bold text-crema outline-none"
            />
          </div>
        </div>
      </Paso>

      {/* ------------------------------------------------- guardar --- */}
      <div className="relative">
        {explosion !== null ? <Explosion key={explosion} semilla={explosion} /> : null}

        {/* Cuando ya se puede guardar, el botón respira para pedir el toque. */}
        <motion.div
          animate={puedeGuardar ? { scale: [1, 1.02, 1] } : { scale: 0.98 }}
          transition={
            puedeGuardar ? { duration: 1.6, repeat: Infinity, ease: [0.65, 0, 0.35, 1] } : resorte
          }
        >
          <Boton
            variante="naranja"
            tamano="xl"
            className="w-full"
            disabled={!puedeGuardar}
            onClick={guardar}
          >
            <IconoCheck className="size-6" />
            Guardar resultado
          </Boton>
        </motion.div>
      </div>

      {/* ------------------------------------------------ cargados --- */}
      <AnimatePresence>
        {cargados.length > 0 ? (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={resorteFirme}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="display text-xl text-crema">Recién cargados</h2>
              <Link
                href="/"
                className="text-2xs font-bold uppercase tracking-[0.12em] text-naranja"
              >
                Ver ranking →
              </Link>
            </div>

            <ul className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {cargados.map((item) => (
                  <motion.li
                    key={item.partido.id}
                    layout
                    initial={{ opacity: 0, x: -24, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 24, scale: 0.9 }}
                    transition={resorte}
                    className="cartel-azul flex flex-wrap items-center gap-3 rounded-md px-3 py-3"
                  >
                    <Avatar jugador={item.ganador} tamano="xs" torcido={false} />
                    <span className="display text-lg text-crema">{item.ganador.nombre}</span>
                    <span className="rotulo rounded-sm border-2 border-tinta bg-naranja px-1.5 py-1 text-tinta">
                      ganó
                    </span>
                    <span className="text-sm font-bold text-crema/60">
                      a {item.perdedor.nombre}
                    </span>

                    {typeof item.partido.puntosA === "number" ? (
                      <span className="display text-lg text-naranja-claro">
                        {Math.max(item.partido.puntosA, item.partido.puntosB ?? 0)}–
                        {Math.min(item.partido.puntosA, item.partido.puntosB ?? 0)}
                      </span>
                    ) : null}

                    <button
                      onClick={() => deshacer(item.partido.id)}
                      className="ml-auto flex items-center gap-1.5 rounded-sm border-2 border-crema/30 px-2 py-1.5 text-2xs font-bold uppercase tracking-[0.1em] text-crema/60 transition-colors duration-100 hover:border-crema hover:text-crema"
                    >
                      <IconoDeshacer className="size-3.5" />
                      Deshacer
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            <Boton
              variante="fantasma"
              className="mt-4"
              onClick={() => {
                const ultimo = cargados[0];
                if (!ultimo) return;
                setSeleccion([ultimo.partido.jugadorA, ultimo.partido.jugadorB]);
                setGanador(null);
              }}
            >
              <IconoMas className="size-4" />
              Otro entre los mismos
            </Boton>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
