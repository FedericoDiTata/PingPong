"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Avatar } from "./Avatar";
import { SelectorDuelo } from "./SelectorDuelo";
import { Boton, Segmentado } from "./ui";
import { IconoBasura, IconoCheck, IconoMas } from "./Iconos";
import { variacionElo } from "@/lib/elo";
import { conSigno } from "@/lib/format";
import type { Liga } from "@/lib/liga";
import type { Game, Partido } from "@/lib/types";

type Fila = { id: string; a: string; b: string };

let contadorFilas = 0;
const filaNueva = (): Fila => ({ id: `game-${(contadorFilas += 1)}`, a: "", b: "" });

function aNumero(valor: string): number | null {
  if (valor.trim() === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? Math.floor(numero) : null;
}

function filaValida(fila: Fila, meta: number): Game | null {
  const a = aNumero(fila.a);
  const b = aNumero(fila.b);
  if (a === null || b === null) return null;
  if (Math.max(a, b) < meta) return null;
  if (Math.abs(a - b) < 2) return null;
  return { a, b };
}

function filaEmpezada(fila: Fila): boolean {
  return fila.a.trim() !== "" || fila.b.trim() !== "";
}

export function CargaManual({
  liga,
  onGuardar,
}: {
  liga: Liga;
  onGuardar: (partido: Omit<Partido, "id">) => string;
}) {
  const [a, setA] = useState<string | null>(null);
  const [b, setB] = useState<string | null>(null);
  const [meta, setMeta] = useState<11 | 21>(11);
  const [filas, setFilas] = useState<Fila[]>(() => [filaNueva()]);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [guardadoId, setGuardadoId] = useState<string | null>(null);

  const games = useMemo(
    () => filas.map((fila) => filaValida(fila, meta)).filter((game): game is Game => game !== null),
    [filas, meta],
  );

  const hayFilasRotas = filas.some((fila) => filaEmpezada(fila) && !filaValida(fila, meta));

  const setsA = games.filter((game) => game.a > game.b).length;
  const setsB = games.length - setsA;
  const hayEmpate = games.length > 0 && setsA === setsB;

  const puedeGuardar =
    Boolean(a) && Boolean(b) && a !== b && games.length > 0 && !hayFilasRotas && !hayEmpate;

  const proyectado = useMemo(() => {
    if (!a || !b || games.length === 0 || hayEmpate) return null;
    const ganaA = setsA > setsB;
    const statsA = liga.stats[a];
    const statsB = liga.stats[b];
    if (!statsA || !statsB) return null;

    const cambio = variacionElo({
      eloGanador: ganaA ? statsA.elo : statsB.elo,
      eloPerdedor: ganaA ? statsB.elo : statsA.elo,
      partidosGanador: ganaA ? statsA.pj : statsB.pj,
      partidosPerdedor: ganaA ? statsB.pj : statsA.pj,
      setsGanador: Math.max(setsA, setsB),
      setsPerdedor: Math.min(setsA, setsB),
    });

    return {
      ganador: ganaA ? statsA.jugador : statsB.jugador,
      perdedor: ganaA ? statsB.jugador : statsA.jugador,
      sube: cambio.ganador,
      baja: cambio.perdedor,
    };
  }, [a, b, games.length, hayEmpate, setsA, setsB, liga.stats]);

  function actualizar(indice: number, lado: "a" | "b", valor: string) {
    const limpio = valor.replace(/[^0-9]/g, "").slice(0, 2);

    setFilas((previas) => {
      const copia = previas.map((fila, i) => (i === indice ? { ...fila, [lado]: limpio } : fila));

      // Si la última fila quedó completa, aparece otra vacía sola: cargar tres
      // games no debería costar tres clics extra en "agregar".
      const ultima = copia[copia.length - 1];
      if (filaValida(ultima, meta) && copia.length < 7) copia.push(filaNueva());

      return copia;
    });
  }

  function guardar() {
    if (!puedeGuardar || !a || !b) return;

    const ahora = new Date();
    const elegida = new Date(`${fecha}T00:00:00`);
    elegida.setHours(ahora.getHours(), ahora.getMinutes(), ahora.getSeconds());

    const id = onGuardar({
      jugadorA: a,
      jugadorB: b,
      games,
      jugadoEn: elegida.toISOString(),
      origen: "manual",
      meta,
    });

    setGuardadoId(id);
  }

  function reiniciar() {
    setFilas([filaNueva()]);
    setGuardadoId(null);
  }

  /* --------------------------------------------------------- Guardado --- */

  const guardado = guardadoId
    ? liga.resultados.find((resultado) => resultado.partido.id === guardadoId)
    : undefined;

  if (guardado) {
    const ganador = liga.porId[guardado.ganadorId];
    const deltaGanador =
      guardado.ganadorId === guardado.partido.jugadorA ? guardado.delta.a : guardado.delta.b;

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="panel flex flex-col items-center gap-5 rounded-lg px-6 py-10 text-center"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-gana/15 text-gana">
          <IconoCheck className="size-6" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-semibold text-tiza">Partido anotado</h3>
          <p className="text-sm text-tiza-45">
            Ganó {ganador?.nombre} {Math.max(guardado.setsA, guardado.setsB)}-
            {Math.min(guardado.setsA, guardado.setsB)} y se llevó{" "}
            <span className="font-mono text-pelota">{conSigno(deltaGanador)}</span> puntos.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Boton variante="primario" onClick={reiniciar}>
            Cargar otro
          </Boton>
          <Link href="/">
            <Boton variante="secundario">Ver ranking</Boton>
          </Link>
        </div>
      </motion.div>
    );
  }

  /* ------------------------------------------------------------ Form --- */

  const jugadorA = a ? liga.porId[a] : null;
  const jugadorB = b ? liga.porId[b] : null;

  return (
    <div className="flex flex-col gap-8">
      <SelectorDuelo
        liga={liga}
        a={a}
        b={b}
        onCambio={(nuevoA, nuevoB) => {
          setA(nuevoA);
          setB(nuevoB);
        }}
      />

      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-2">
          <span className="etiqueta">Games a</span>
          <Segmentado
            idGrupo="meta-manual"
            valor={String(meta)}
            onCambio={(valor) => setMeta(Number(valor) as 11 | 21)}
            opciones={[
              { valor: "11", texto: "11 puntos" },
              { valor: "21", texto: "21 puntos" },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="fecha-partido" className="etiqueta">
            Cuándo se jugó
          </label>
          <input
            id="fecha-partido"
            type="date"
            value={fecha}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(evento) => setFecha(evento.target.value)}
            className="h-10 rounded-md border border-[var(--borde)] bg-mesa-850 px-3 text-sm text-tiza-70 outline-none transition-colors duration-150 hover:border-[var(--borde-fuerte)] focus:border-pelota/60"
          />
        </div>
      </div>

      {jugadorA && jugadorB ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="etiqueta w-16">Game</span>
            <div className="flex flex-1 items-center justify-center gap-3">
              <span className="flex flex-1 items-center justify-end gap-2 truncate text-sm text-tiza-70">
                {jugadorA.nombre}
                <Avatar jugador={jugadorA} tamano="xs" />
              </span>
              <span className="w-6" />
              <span className="flex flex-1 items-center gap-2 truncate text-sm text-tiza-70">
                <Avatar jugador={jugadorB} tamano="xs" />
                {jugadorB.nombre}
              </span>
            </div>
            <span className="w-8" />
          </div>

          <AnimatePresence initial={false}>
            {filas.map((fila, indice) => {
              const roto = filaEmpezada(fila) && !filaValida(fila, meta);
              return (
                <motion.div
                  key={fila.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-3"
                >
                  <span className="w-16 font-mono text-2xs text-tiza-25">
                    {String(indice + 1).padStart(2, "0")}
                  </span>

                  <div className="flex flex-1 items-center justify-center gap-3">
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={fila.a}
                      onChange={(evento) => actualizar(indice, "a", evento.target.value)}
                      placeholder="—"
                      aria-label={`Puntos de ${jugadorA.nombre} en el game ${indice + 1}`}
                      className={`h-12 w-full flex-1 rounded-md border bg-mesa-850 text-center font-mono text-lg tabular-nums text-tiza outline-none transition-colors duration-150 placeholder:text-tiza-25 focus:bg-mesa-800 ${
                        roto ? "border-pierde/50" : "border-[var(--borde)] focus:border-pelota/60"
                      }`}
                    />
                    <span className="w-6 text-center font-mono text-tiza-25">–</span>
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={fila.b}
                      onChange={(evento) => actualizar(indice, "b", evento.target.value)}
                      placeholder="—"
                      aria-label={`Puntos de ${jugadorB.nombre} en el game ${indice + 1}`}
                      className={`h-12 w-full flex-1 rounded-md border bg-mesa-850 text-center font-mono text-lg tabular-nums text-tiza outline-none transition-colors duration-150 placeholder:text-tiza-25 focus:bg-mesa-800 ${
                        roto ? "border-pierde/50" : "border-[var(--borde)] focus:border-pelota/60"
                      }`}
                    />
                  </div>

                  <button
                    onClick={() => setFilas((previas) => previas.filter((_, i) => i !== indice))}
                    disabled={filas.length === 1}
                    aria-label={`Quitar game ${indice + 1}`}
                    className="w-8 shrink-0 rounded-xs p-1.5 text-tiza-25 transition-colors duration-150 hover:text-pierde disabled:opacity-0"
                  >
                    <IconoBasura className="size-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <div className="flex items-center gap-3">
            <Boton
              tamano="sm"
              variante="fantasma"
              onClick={() => setFilas((previas) => [...previas, filaNueva()])}
            >
              <IconoMas className="size-3.5" />
              Agregar game
            </Boton>

            {hayFilasRotas ? (
              <span className="text-2xs text-pierde">
                Cada game se gana con {meta} puntos y dos de diferencia.
              </span>
            ) : null}
            {hayEmpate ? (
              <span className="text-2xs text-pelota">
                Van {setsA}-{setsB}: falta un game para desempatar.
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-sm text-tiza-45">Elegí los dos jugadores para cargar el marcador.</p>
      )}

      <AnimatePresence>
        {proyectado ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="panel flex flex-wrap items-center gap-x-6 gap-y-3 rounded-md px-4 py-3.5"
          >
            <div className="flex items-center gap-2.5">
              <Avatar jugador={proyectado.ganador} tamano="xs" />
              <span className="text-sm text-tiza">
                Gana {proyectado.ganador.nombre}{" "}
                <span className="font-mono text-pelota">
                  {Math.max(setsA, setsB)}-{Math.min(setsA, setsB)}
                </span>
              </span>
            </div>
            <div className="ml-auto flex items-center gap-4 font-mono text-xs">
              <span className="text-gana">
                {proyectado.ganador.nombre} {conSigno(proyectado.sube)}
              </span>
              <span className="text-pierde">
                {proyectado.perdedor.nombre} {conSigno(proyectado.baja)}
              </span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Boton variante="primario" tamano="lg" disabled={!puedeGuardar} onClick={guardar}>
        Guardar partido
      </Boton>
    </div>
  );
}
