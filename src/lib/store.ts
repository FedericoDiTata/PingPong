"use client";

import { useSyncExternalStore } from "react";
import { esLigaDeEjemplo, ligaInicial } from "./inicial";
import { computarLiga, type Liga } from "./liga";
import {
  bajarJugador,
  bajarPartido,
  escucharCambios,
  hayNube,
  leerLiga,
  reemplazarTodo,
  sembrarSiEstaVacia,
  subirJugador,
  subirPartido,
  sumarALaLiga,
} from "./nube";
import { ESTADO_VACIO, type Estado, type Jugador, type Partido } from "./types";

const CLAVE = "mesa.liga.v1";

/** Marca de que este navegador ya se presentó ante la liga compartida. */
const CLAVE_PRESENTADA = "mesa.presentada.v1";

/**
 * Estado de la liga, con dos formas de guardarlo.
 *
 * Con Supabase configurado, la base es la verdad: se lee al abrir, se escribe
 * en cada cambio y el tiempo real trae lo que cargan los demás. El navegador
 * queda como copia local, para pintar algo al instante y para que la app no se
 * caiga si el teléfono está sin señal.
 *
 * Sin Supabase, todo vive en el navegador como antes. Así una copia recién
 * clonada del repo anda igual, sin cuenta ni configuración.
 *
 * Las escrituras son optimistas: la pantalla se actualiza sola y la red va
 * atrás. Si falla, `guardado` pasa a false y la app lo dice en vez de fingir.
 */
/**
 * Lo que se le muestra a un navegador que entra por primera vez a la liga
 * compartida. Aparece una sola vez por computadora y sirve para dos cosas:
 * decir en voz alta que a partir de ahora los datos son de todos, y no tirar a
 * la basura lo que ese navegador tuviera guardado de antes.
 */
export type Presentacion = {
  /** Lo que ya hay en la liga compartida. */
  enLaLiga: { jugadores: number; partidos: number };
  /**
   * Lo que este navegador tiene guardado y en la liga no está. Null cuando no
   * hay nada para aportar, que es el caso de cualquier teléfono que entra por
   * primera vez.
   */
  pendiente: Estado | null;
};

type Instantanea = {
  estado: Estado;
  hidratado: boolean;
  /** false si lo último que se intentó guardar no llegó a destino. */
  guardado: boolean;
  /** No null mientras haya que mostrar la pantalla de bienvenida. */
  presentacion: Presentacion | null;
  /**
   * true si hubo que crear la liga inicial porque el navegador estaba vacío.
   * Sólo aplica sin Supabase: es la pista de que se perdieron los datos, que
   * si no se confunde con abrir la app por primera vez.
   */
  sembrada: boolean;
};

const INSTANTANEA_SERVIDOR: Instantanea = {
  estado: ESTADO_VACIO,
  hidratado: false,
  guardado: true,
  presentacion: null,
  sembrada: false,
};

let instantanea: Instantanea = INSTANTANEA_SERVIDOR;
let hidratacionPedida = false;

const oyentes = new Set<() => void>();

function emitir() {
  for (const oyente of oyentes) oyente();
}

function publicar(cambios: Partial<Instantanea>) {
  instantanea = { ...instantanea, ...cambios };
  emitir();
}

function nuevoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/* ------------------------------------------------------------ normalizar --- */

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

/* -------------------------------------------------------- copia local --- */

function leerCache(): Estado | null {
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return null;
    return normalizar(JSON.parse(crudo));
  } catch {
    return null;
  }
}

function guardarCache(estado: Estado): boolean {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(estado));
    return true;
  } catch {
    return false;
  }
}

/* --------------------------------------------------------- aplicar --- */

/**
 * Cambia el estado en pantalla ya, y manda el cambio a la base por atrás.
 * Sin Supabase, lo que manda es si el navegador aceptó guardar.
 */
function aplicar(receta: (previo: Estado) => Estado, sincronizar?: () => Promise<void>) {
  const estado = receta(instantanea.estado);
  const enDisco = guardarCache(estado);

  publicar({ estado, guardado: hayNube ? instantanea.guardado : enDisco });

  if (hayNube && sincronizar) {
    sincronizar()
      .then(() => publicar({ guardado: true }))
      .catch((error) => {
        console.error("No se pudo guardar en Supabase", error);
        publicar({ guardado: false });
      });
  }
}

/* ------------------------------------------------------------ hidratar --- */

let refrescando = false;

async function refrescar() {
  if (refrescando) return;
  refrescando = true;
  try {
    const estado = await leerLiga();
    guardarCache(estado);
    publicar({ estado, guardado: true });
  } catch (error) {
    console.error("No se pudo refrescar la liga", error);
  } finally {
    refrescando = false;
  }
}

function escucharOtrasPestanas() {
  window.addEventListener("storage", (evento) => {
    if (evento.key !== CLAVE || !evento.newValue) return;
    try {
      const dato = normalizar(JSON.parse(evento.newValue));
      if (dato) publicar({ estado: dato });
    } catch {
      /* ignorar */
    }
  });
}

/* ---------------------------------------------------------- primera vez --- */

function yaPresentada(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_PRESENTADA) === "si";
  } catch {
    // Sin acceso al almacenamiento no podemos recordar la respuesta, y una
    // bienvenida que vuelve en cada visita es peor que no mostrarla.
    return true;
  }
}

function marcarPresentada() {
  try {
    window.localStorage.setItem(CLAVE_PRESENTADA, "si");
  } catch {
    /* la app sigue igual, sólo va a volver a saludar */
  }
}

/**
 * Lo que este navegador tiene guardado y en la liga no está, comparando por id.
 * Van los jugadores además de los partidos porque un partido puede ser contra
 * alguien que se agregó acá y allá todavía no existe.
 */
function faltantes(cache: Estado | null, enLaLiga: Estado): Estado | null {
  if (!cache) return null;

  const jugadoresAlla = new Set(enLaLiga.jugadores.map((jugador) => jugador.id));
  const partidosAlla = new Set(enLaLiga.partidos.map((partido) => partido.id));

  const jugadores = cache.jugadores.filter((jugador) => !jugadoresAlla.has(jugador.id));
  const partidos = cache.partidos.filter((partido) => !partidosAlla.has(partido.id));

  if (jugadores.length === 0 && partidos.length === 0) return null;
  return { version: 2, jugadores, partidos };
}

/** Entra sin aportar nada: la liga de la nube pasa a ser la única verdad. */
function entrarALaLiga() {
  marcarPresentada();
  // Recién ahora se pisa la copia local: es la respuesta explícita de que lo
  // que había en este navegador y no está en la liga se deja atrás.
  guardarCache(instantanea.estado);
  publicar({ presentacion: null });
}

/** Entra sumando lo que había en este navegador. No pisa nada de lo que ya hay. */
async function sumarYEntrar(): Promise<boolean> {
  const pendiente = instantanea.presentacion?.pendiente;
  if (!pendiente) {
    entrarALaLiga();
    return true;
  }

  try {
    await sumarALaLiga(pendiente);
    const estado = await leerLiga();
    guardarCache(estado);
    marcarPresentada();
    publicar({ estado, guardado: true, presentacion: null });
    return true;
  } catch (error) {
    console.error("No se pudieron sumar los partidos de este navegador", error);
    publicar({ guardado: false });
    return false;
  }
}

/** Primera lectura. Se dispara al montar el primer suscriptor. */
async function hidratar() {
  if (hidratacionPedida) return;
  hidratacionPedida = true;

  const cache = leerCache();

  if (!hayNube) {
    const sembrar = !cache || esLigaDeEjemplo(cache);
    const inicial = sembrar ? ligaInicial() : cache;
    publicar({
      estado: inicial,
      hidratado: true,
      guardado: sembrar ? guardarCache(inicial) : true,
      sembrada: sembrar,
    });
    escucharOtrasPestanas();
    return;
  }

  // Mientras baja lo de verdad, mostramos la última copia conocida.
  if (cache) publicar({ estado: cache, hidratado: true });

  try {
    await sembrarSiEstaVacia(ligaInicial());
    const estado = await leerLiga();

    const presentacion: Presentacion | null = yaPresentada()
      ? null
      : {
          enLaLiga: { jugadores: estado.jugadores.length, partidos: estado.partidos.length },
          pendiente: faltantes(cache, estado),
        };

    // La copia local se pisa recién cuando no queda nada por decidir. Si hay
    // partidos que todavía no están en la liga, guardar acá lo de la nube los
    // borraría del navegador antes de que nadie eligiera qué hacer con ellos, y
    // cerrar la pestaña sin contestar alcanzaría para perderlos.
    if (!presentacion?.pendiente) guardarCache(estado);

    publicar({ estado, hidratado: true, guardado: true, sembrada: false, presentacion });
    escucharCambios(refrescar);
  } catch (error) {
    console.error("No se pudo leer la liga de Supabase", error);
    publicar({
      estado: cache ?? ligaInicial(),
      hidratado: true,
      guardado: false,
      sembrada: false,
    });
  }
}

function suscribir(alCambiar: () => void) {
  void hidratar();
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

  aplicar(
    (previo) => ({ ...previo, jugadores: [...previo.jugadores, jugador] }),
    () => subirJugador(jugador),
  );

  return jugador;
}

function editarJugador(id: string, cambios: Partial<Pick<Jugador, "nombre" | "emoji">>) {
  const actual = instantanea.estado.jugadores.find((jugador) => jugador.id === id);
  if (!actual) return;

  const actualizado: Jugador = {
    ...actual,
    ...cambios,
    nombre: cambios.nombre?.trim() || actual.nombre,
  };

  aplicar(
    (previo) => ({
      ...previo,
      jugadores: previo.jugadores.map((jugador) => (jugador.id === id ? actualizado : jugador)),
    }),
    () => subirJugador(actualizado),
  );
}

function borrarJugador(id: string) {
  aplicar(
    (previo) => ({
      ...previo,
      jugadores: previo.jugadores.filter((jugador) => jugador.id !== id),
      partidos: previo.partidos.filter(
        (partido) => partido.jugadorA !== id && partido.jugadorB !== id,
      ),
    }),
    () => bajarJugador(id),
  );
}

function agregarPartido(datos: Omit<Partido, "id">): Partido {
  const partido: Partido = { ...datos, id: nuevoId() };

  aplicar(
    (previo) => ({ ...previo, partidos: [...previo.partidos, partido] }),
    () => subirPartido(partido),
  );

  return partido;
}

function borrarPartido(id: string) {
  aplicar(
    (previo) => ({ ...previo, partidos: previo.partidos.filter((partido) => partido.id !== id) }),
    () => bajarPartido(id),
  );
}

function exportar(): string {
  return JSON.stringify(instantanea.estado, null, 2);
}

function importar(crudo: string): { ok: boolean; error?: string } {
  try {
    const dato = normalizar(JSON.parse(crudo));
    if (!dato) return { ok: false, error: "El archivo no tiene el formato de una liga." };
    aplicar(
      () => dato,
      () => reemplazarTodo(dato),
    );
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo leer el archivo: no es un JSON válido." };
  }
}

function vaciar() {
  const vacio: Estado = { ...ESTADO_VACIO };
  aplicar(
    () => vacio,
    () => reemplazarTodo(vacio),
  );
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
  const { estado, hidratado, guardado, sembrada, presentacion } = useSyncExternalStore(
    suscribir,
    leer,
    leerEnServidor,
  );

  return {
    estado,
    hidratado,
    guardado,
    sembrada,
    presentacion,
    entrarALaLiga,
    sumarYEntrar,
    /** true si la liga es compartida (Supabase) y no sólo de este navegador. */
    compartida: hayNube,
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
