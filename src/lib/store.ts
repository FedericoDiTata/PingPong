"use client";

import { useSyncExternalStore } from "react";
import { computarLiga, type Liga } from "./liga";
import { esLigaDeEjemplo, ligaInicial } from "./inicial";
import { ESTADO_VACIO, type Estado, type Jugador, type Partido } from "./types";

const CLAVE = "mesa.liga.v1";

/**
 * Store externo con `useSyncExternalStore`.
 *
 * Todo vive en localStorage del navegador. Es una decisión, no una limitación:
 * la app funciona sin cuenta, sin servidor y sin conexión. Exportar e importar
 * el JSON es el puente para pasar la liga de un teléfono a otro.
 */
type Instantanea = {
  estado: Estado;
  hidratado: boolean;
  /** false si la última escritura en el navegador falló (cuota, modo privado). */
  guardado: boolean;
};

const INSTANTANEA_SERVIDOR: Instantanea = {
  estado: ESTADO_VACIO,
  hidratado: false,
  guardado: true,
};

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

type PartidoCrudo = Partial<Partido> & {
  games?: Array<{ a?: unknown; b?: unknown }>;
};

/**
 * Acepta el formato viejo (partidos al mejor de N, con lista de games) y lo
 * traduce al actual: un game a 11 con marcador opcional. Un archivo exportado
 * hace meses tiene que seguir abriendo.
 */
function normalizarPartido(crudo: PartidoCrudo): Partido | null {
  if (
    typeof crudo?.id !== "string" ||
    typeof crudo.jugadorA !== "string" ||
    typeof crudo.jugadorB !== "string"
  ) {
    return null;
  }

  let puntosA = typeof crudo.puntosA === "number" ? crudo.puntosA : undefined;
  let puntosB = typeof crudo.puntosB === "number" ? crudo.puntosB : undefined;
  let ganador = typeof crudo.ganador === "string" ? crudo.ganador : null;

  if (Array.isArray(crudo.games) && crudo.games.length > 0) {
    let ganadosA = 0;
    let ganadosB = 0;
    for (const game of crudo.games) {
      const a = Number(game?.a);
      const b = Number(game?.b);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      if (a > b) ganadosA += 1;
      else ganadosB += 1;
    }

    if (crudo.games.length === 1 && puntosA === undefined) {
      const unico = crudo.games[0];
      puntosA = Number(unico?.a);
      puntosB = Number(unico?.b);
    }

    ganador ??= ganadosA >= ganadosB ? crudo.jugadorA : crudo.jugadorB;
  }

  if (!ganador || (ganador !== crudo.jugadorA && ganador !== crudo.jugadorB)) return null;

  const conPuntos = Number.isFinite(puntosA) && Number.isFinite(puntosB);

  return {
    id: crudo.id,
    jugadorA: crudo.jugadorA,
    jugadorB: crudo.jugadorB,
    ganador,
    jugadoEn: typeof crudo.jugadoEn === "string" ? crudo.jugadoEn : new Date().toISOString(),
    ...(conPuntos ? { puntosA: puntosA as number, puntosB: puntosB as number } : {}),
  };
}

function normalizar(dato: unknown): Estado | null {
  if (typeof dato !== "object" || dato === null) return null;
  const posible = dato as { jugadores?: unknown; partidos?: unknown };
  if (!Array.isArray(posible.jugadores) || !Array.isArray(posible.partidos)) return null;

  const jugadores = posible.jugadores.filter(
    (jugador): jugador is Jugador =>
      typeof jugador?.id === "string" && typeof jugador?.nombre === "string",
  );

  const ids = new Set(jugadores.map((jugador) => jugador.id));

  const partidos = (posible.partidos as PartidoCrudo[])
    .map(normalizarPartido)
    .filter(
      (partido): partido is Partido =>
        partido !== null && ids.has(partido.jugadorA) && ids.has(partido.jugadorB),
    );

  return { version: 2, jugadores, partidos };
}

function leerAlmacenado(): Estado | null {
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return null;
    return normalizar(JSON.parse(crudo));
  } catch {
    return null;
  }
}

/**
 * Devuelve si pudo escribir. Que esto falle en silencio es peor que el error
 * en sí: la app sigue andando con los datos en memoria y el usuario se entera
 * recién cuando vuelve a abrirla y no está nada de lo que cargó.
 */
function persistir(estado: Estado): boolean {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(estado));
    return true;
  } catch {
    return false;
  }
}

function fijar(estado: Estado, guardar = true) {
  const guardado = guardar ? persistir(estado) : instantanea.guardado;
  instantanea = { estado, hidratado: true, guardado };
  emitir();
}

function actualizar(receta: (previo: Estado) => Estado, guardar = true) {
  fijar(receta(instantanea.estado), guardar);
}

/** Primera lectura del disco. Se dispara al montar el primer suscriptor. */
function hidratar() {
  if (hidratacionPedida) return;
  hidratacionPedida = true;

  // Navegador sin datos (o con la liga de ejemplo vieja pegada del release
  // anterior): se siembra el historial que ya existía en papel y se guarda en
  // el acto. A partir de ahí manda siempre lo que hay en disco, así que borrar
  // un partido de la siembra no lo resucita en la próxima visita.
  const almacenado = leerAlmacenado();
  const sembrar = !almacenado || esLigaDeEjemplo(almacenado);
  const inicial = sembrar ? ligaInicial() : almacenado;

  instantanea = {
    estado: inicial,
    hidratado: true,
    guardado: sembrar ? persistir(inicial) : true,
  };

  // Dos pestañas abiertas se mantienen sincronizadas.
  window.addEventListener("storage", (evento) => {
    if (evento.key !== CLAVE || !evento.newValue) return;
    try {
      const dato = normalizar(JSON.parse(evento.newValue));
      if (dato) fijar(dato, false);
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

function editarJugador(id: string, cambios: Partial<Pick<Jugador, "nombre" | "emoji" | "foto">>) {
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
    const dato = normalizar(JSON.parse(crudo));
    if (!dato) return { ok: false, error: "El archivo no tiene el formato de una liga." };
    fijar(dato);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo leer el archivo: no es un JSON válido." };
  }
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
  const { estado, hidratado, guardado } = useSyncExternalStore(suscribir, leer, leerEnServidor);

  return {
    estado,
    hidratado,
    guardado,
    liga: ligaDe(estado),
    agregarJugador,
    editarJugador,
    borrarJugador,
    agregarPartido,
    borrarPartido,
    exportar,
    importar,
    vaciar,
  };
}
