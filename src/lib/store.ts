"use client";

import { useSyncExternalStore } from "react";
import { computarLiga, type Liga } from "./liga";
import { generarDemo } from "./demo";
import { ESTADO_VACIO, type Estado, type Jugador, type Partido } from "./types";

const CLAVE = "mesa.liga.v1";

/**
 * Store externo con `useSyncExternalStore`.
 *
 * Todo vive en localStorage del navegador. Es una decisión, no una limitación:
 * la app funciona sin cuenta, sin servidor y sin conexión, que es exactamente
 * el contexto de uso (un celular apoyado al lado de la red). Exportar e
 * importar el JSON es el puente para pasar la liga de un teléfono a otro.
 */
type Instantanea = { estado: Estado; hidratado: boolean };

const INSTANTANEA_SERVIDOR: Instantanea = { estado: ESTADO_VACIO, hidratado: false };

let instantanea: Instantanea = INSTANTANEA_SERVIDOR;
let hidratacionPedida = false;

const oyentes = new Set<() => void>();

function emitir() {
  for (const oyente of oyentes) oyente();
}

function nuevoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function validar(dato: unknown): dato is Estado {
  if (typeof dato !== "object" || dato === null) return false;
  const posible = dato as Partial<Estado>;
  if (!Array.isArray(posible.jugadores) || !Array.isArray(posible.partidos)) return false;

  const jugadoresOk = posible.jugadores.every(
    (jugador) => typeof jugador?.id === "string" && typeof jugador?.nombre === "string",
  );
  const partidosOk = posible.partidos.every(
    (partido) =>
      typeof partido?.id === "string" &&
      typeof partido?.jugadorA === "string" &&
      typeof partido?.jugadorB === "string" &&
      Array.isArray(partido?.games),
  );

  return jugadoresOk && partidosOk;
}

function leerAlmacenado(): Estado | null {
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const dato: unknown = JSON.parse(crudo);
    return validar(dato) ? dato : null;
  } catch {
    return null;
  }
}

function persistir(estado: Estado) {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch {
    // Cuota llena o modo privado: la sesión sigue funcionando en memoria.
  }
}

function fijar(estado: Estado, guardar = true) {
  instantanea = { estado, hidratado: true };
  if (guardar) persistir(estado);
  emitir();
}

function actualizar(receta: (previo: Estado) => Estado, guardar = true) {
  fijar(receta(instantanea.estado), guardar);
}

/** Primera lectura del disco. Se dispara al montar el primer suscriptor. */
function hidratar() {
  if (hidratacionPedida) return;
  hidratacionPedida = true;

  const guardado = leerAlmacenado();
  instantanea = { estado: guardado ?? instantanea.estado, hidratado: true };

  // Dos pestañas abiertas durante un torneo se mantienen sincronizadas.
  window.addEventListener("storage", (evento) => {
    if (evento.key !== CLAVE || !evento.newValue) return;
    try {
      const dato: unknown = JSON.parse(evento.newValue);
      if (validar(dato)) fijar(dato, false);
    } catch {
      /* ignorar */
    }
  });
}

function suscribir(alCambiar: () => void) {
  hidratar();
  oyentes.add(alCambiar);
  return () => {
    oyentes.delete(alCambiar);
  };
}

const leer = () => instantanea;
const leerEnServidor = () => INSTANTANEA_SERVIDOR;

/* --------------------------------------------------------------- Acciones --- */

function agregarJugador(nombre: string, emoji: string): Jugador | null {
  const limpio = nombre.trim();
  if (!limpio) return null;

  const jugador: Jugador = {
    id: nuevoId(),
    nombre: limpio,
    emoji,
    creadoEn: new Date().toISOString(),
  };

  actualizar((previo) => ({ ...previo, jugadores: [...previo.jugadores, jugador] }));
  return jugador;
}

function editarJugador(id: string, cambios: Partial<Pick<Jugador, "nombre" | "emoji">>) {
  actualizar((previo) => ({
    ...previo,
    jugadores: previo.jugadores.map((jugador) =>
      jugador.id === id
        ? { ...jugador, ...cambios, nombre: cambios.nombre?.trim() || jugador.nombre }
        : jugador,
    ),
  }));
}

function borrarJugador(id: string) {
  actualizar((previo) => ({
    ...previo,
    jugadores: previo.jugadores.filter((jugador) => jugador.id !== id),
    partidos: previo.partidos.filter(
      (partido) => partido.jugadorA !== id && partido.jugadorB !== id,
    ),
  }));
}

function agregarPartido(datos: Omit<Partido, "id">): Partido {
  const partido: Partido = { ...datos, id: nuevoId() };
  actualizar((previo) => ({ ...previo, partidos: [...previo.partidos, partido] }));
  return partido;
}

function borrarPartido(id: string) {
  actualizar((previo) => ({
    ...previo,
    partidos: previo.partidos.filter((partido) => partido.id !== id),
  }));
}

function exportar(): string {
  return JSON.stringify(instantanea.estado, null, 2);
}

function importar(crudo: string): { ok: boolean; error?: string } {
  try {
    const dato: unknown = JSON.parse(crudo);
    if (!validar(dato)) return { ok: false, error: "El archivo no tiene el formato de una liga." };
    fijar({ version: 1, jugadores: dato.jugadores, partidos: dato.partidos });
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo leer el archivo: no es un JSON válido." };
  }
}

function cargarDemo() {
  fijar(generarDemo());
}

function vaciar() {
  fijar({ ...ESTADO_VACIO });
}

/* ------------------------------------------------------------------ Hook --- */

// La liga derivada se cachea por identidad del estado: computarLiga corre una
// sola vez por cambio, aunque la consulten cinco componentes distintos.
let estadoCacheado: Estado | null = null;
let ligaCacheada: Liga | null = null;

function ligaDe(estado: Estado): Liga {
  if (estadoCacheado === estado && ligaCacheada) return ligaCacheada;
  estadoCacheado = estado;
  ligaCacheada = computarLiga(estado);
  return ligaCacheada;
}

export function useLiga() {
  const { estado, hidratado } = useSyncExternalStore(suscribir, leer, leerEnServidor);

  return {
    estado,
    hidratado,
    liga: ligaDe(estado),
    agregarJugador,
    editarJugador,
    borrarJugador,
    agregarPartido,
    borrarPartido,
    exportar,
    importar,
    cargarDemo,
    vaciar,
  };
}
