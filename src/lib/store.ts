"use client";

import { useSyncExternalStore } from "react";
import { esLigaDeEjemplo, ligaInicial } from "./inicial";
import { computarLiga, type Liga } from "./liga";
import {
  anotarMovimiento,
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
import {
  ESTADO_VACIO,
  type EntidadMovimiento,
  type Estado,
  type Jugador,
  type Movimiento,
  type Partido,
  type Quien,
  type TipoMovimiento,
} from "./types";

const CLAVE = "mesa.liga.v1";

/** Marca de que este navegador ya se presentó ante la liga compartida. */
const CLAVE_PRESENTADA = "mesa.presentada.v1";

/** De quién es este dispositivo, para firmar lo que se carga desde acá. */
const CLAVE_QUIEN = "mesa.quien.v1";

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
type Instantanea = {
  estado: Estado;
  hidratado: boolean;
  /** false si lo último que se intentó guardar no llegó a destino. */
  guardado: boolean;
  /** No null mientras haya que mostrar la pantalla de bienvenida. */
  presentacion: Presentacion | null;
  /** De quién es este dispositivo. Null hasta que se conteste. */
  quien: Quien | null;
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
  quien: null,
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
 * Los ids de la siembra inicial se rellenaron con ceros después de la primera
 * versión: "historial-7" pasó a ser "historial-007".
 *
 * Sin esto, un navegador que quedó con la siembra vieja los ve como partidos
 * distintos de los que están en la liga, y al conectarse los sube todos: el
 * historial entero duplicado, 76 partidos que aparecen dos veces. Pasó de
 * verdad, en la computadora del trabajo, el 2026-08-13.
 */
function idDeHistorial(id: string): string {
  const viejo = /^historial-(\d{1,2})$/.exec(id);
  return viejo ? `historial-${viejo[1].padStart(3, "0")}` : id;
}

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
    id: idDeHistorial(crudo.id),
    jugadorA: crudo.jugadorA,
    jugadorB: crudo.jugadorB,
    ganador,
    jugadoEn: typeof crudo.jugadoEn === "string" ? crudo.jugadoEn : new Date().toISOString(),
    ...(conPuntos ? { puntosA: puntosA as number, puntosB: puntosB as number } : {}),
  };
}

function normalizar(dato: unknown): Estado | null {
  if (typeof dato !== "object" || dato === null) return null;
  const posible = dato as {
    jugadores?: unknown;
    partidos?: unknown;
    movimientos?: unknown;
  };
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

  // El registro puede no estar: los archivos exportados antes de que existiera
  // siguen abriendo, sin registro y sin romper nada.
  const crudos = Array.isArray(posible.movimientos) ? posible.movimientos : [];
  const movimientos = (crudos as Movimiento[]).filter(
    (movimiento) =>
      typeof movimiento?.id === "string" &&
      typeof movimiento.sobre === "string" &&
      typeof movimiento.quienNombre === "string",
  );

  return { version: 2, jugadores, partidos, movimientos };
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

/* ------------------------------------------------------------- registro --- */

function leerQuien(): Quien | null {
  try {
    const crudo = window.localStorage.getItem(CLAVE_QUIEN);
    if (!crudo) return null;
    const dato = JSON.parse(crudo) as Quien;
    return typeof dato?.id === "string" && typeof dato?.nombre === "string" ? dato : null;
  } catch {
    return null;
  }
}

/** Deja anotado de quién es este dispositivo. Se puede cambiar cuando se quiera. */
function elegirQuien(quien: Quien) {
  try {
    window.localStorage.setItem(CLAVE_QUIEN, JSON.stringify(quien));
  } catch {
    // Sin almacenamiento lo va a volver a preguntar en la próxima visita, pero
    // por esta sesión ya sabemos a nombre de quién anotar.
  }
  publicar({ quien });
}

/** Suelta la identidad de este dispositivo: la app vuelve a preguntar quién es. */
function olvidarQuien() {
  try {
    window.localStorage.removeItem(CLAVE_QUIEN);
  } catch {
    /* si no se puede borrar, alcanza con soltarlo en memoria */
  }
  publicar({ quien: null });
}

/**
 * Para el que abre la app y todavía no está en la liga: se suma como jugador y
 * el dispositivo queda a su nombre.
 *
 * El orden importa. Primero queda anotado quién es y después se crea el
 * jugador, así el alta figura hecha por esa misma persona y no por nadie.
 */
function presentarseComoNuevo(nombre: string, emoji: string): Jugador | null {
  const limpio = nombre.trim();
  if (!limpio) return null;

  const id = nuevoId();
  elegirQuien({ id, nombre: limpio });

  const jugador = agregarJugador(limpio, emoji, id);
  if (!jugador) return null;

  // agregarJugador puede haber recortado el nombre; que el registro y la lista
  // digan lo mismo.
  elegirQuien({ id: jugador.id, nombre: jugador.nombre });
  return jugador;
}

/**
 * Suma una línea al registro y la manda a la base.
 *
 * El nombre se guarda además del id porque el registro tiene que seguir
 * leyéndose dentro de un año, aunque esa persona ya no esté en la liga.
 *
 * Si falla el envío no se marca la liga como "sin guardar": el partido ya se
 * guardó, y avisar que no se guardó nada sería mentir sobre lo que importa.
 * Queda en la consola y la línea vive igual en la copia local.
 */
function anotar(
  entidad: EntidadMovimiento,
  tipo: TipoMovimiento,
  sobre: string,
  fotos: { antes?: Partido | Jugador; despues?: Partido | Jugador },
  quienForzado?: Quien,
) {
  const quien = quienForzado ?? instantanea.quien;

  const movimiento: Movimiento = {
    id: nuevoId(),
    entidad,
    tipo,
    sobre,
    quienId: quien?.id ?? null,
    quienNombre: quien?.nombre ?? "sin identificar",
    ...fotos,
    cuando: new Date().toISOString(),
  };

  aplicar((previo) => ({
    ...previo,
    movimientos: [movimiento, ...previo.movimientos],
  }));

  if (hayNube) {
    anotarMovimiento(movimiento).catch((error) => {
      console.error("No se pudo anotar en el registro", error);
    });
  }
}

/** Quién cargó un partido, según el registro. Undefined si es del historial viejo. */
export function autorDe(estado: Estado, partidoId: string): string | undefined {
  return estado.movimientos.find(
    (movimiento) => movimiento.tipo === "alta" && movimiento.sobre === partidoId,
  )?.quienNombre;
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

  const movimientosAlla = new Set(enLaLiga.movimientos.map((movimiento) => movimiento.id));

  const jugadores = cache.jugadores.filter((jugador) => !jugadoresAlla.has(jugador.id));
  const partidos = cache.partidos.filter((partido) => !partidosAlla.has(partido.id));
  const movimientos = cache.movimientos.filter((movimiento) => !movimientosAlla.has(movimiento.id));

  // El registro solo no cuenta como algo para ofrecer: si lo único distinto son
  // líneas de registro, se suben calladas junto con lo demás.
  if (jugadores.length === 0 && partidos.length === 0) return null;
  return { version: 2, jugadores, partidos, movimientos };
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
      quien: leerQuien(),
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
          enLaLiga: {
            jugadores: estado.jugadores.length,
            partidos: estado.partidos.length,
          },
          pendiente: faltantes(cache, estado),
        };

    // La copia local se pisa recién cuando no queda nada por decidir. Si hay
    // partidos que todavía no están en la liga, guardar acá lo de la nube los
    // borraría del navegador antes de que nadie eligiera qué hacer con ellos, y
    // cerrar la pestaña sin contestar alcanzaría para perderlos.
    if (!presentacion?.pendiente) guardarCache(estado);

    publicar({
      estado,
      hidratado: true,
      guardado: true,
      sembrada: false,
      presentacion,
      quien: leerQuien(),
    });
    escucharCambios(refrescar);
  } catch (error) {
    console.error("No se pudo leer la liga de Supabase", error);
    publicar({
      estado: cache ?? ligaInicial(),
      hidratado: true,
      guardado: false,
      sembrada: false,
      quien: leerQuien(),
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

function agregarJugador(nombre: string, emoji: string, idPedido?: string): Jugador | null {
  const limpio = nombre.trim();
  if (!limpio) return null;

  const jugador: Jugador = {
    id: idPedido ?? nuevoId(),
    nombre: limpio,
    emoji,
    creadoEn: new Date().toISOString(),
  };

  aplicar(
    (previo) => ({ ...previo, jugadores: [...previo.jugadores, jugador] }),
    () => subirJugador(jugador),
  );

  anotar("jugador", "alta", jugador.id, { despues: jugador });

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

  anotar("jugador", "edicion", id, { antes: actual, despues: actualizado });
}

function borrarJugador(id: string) {
  const borrado = instantanea.estado.jugadores.find((jugador) => jugador.id === id);

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

  if (borrado) anotar("jugador", "baja", id, { antes: borrado });
}

function agregarPartido(datos: Omit<Partido, "id">): Partido {
  const partido: Partido = { ...datos, id: nuevoId() };

  aplicar(
    (previo) => ({ ...previo, partidos: [...previo.partidos, partido] }),
    () => subirPartido(partido),
  );

  anotar("partido", "alta", partido.id, { despues: partido });

  return partido;
}

function borrarPartido(id: string) {
  // La foto se saca antes de borrar: después ya no hay de dónde.
  const borrado = instantanea.estado.partidos.find((partido) => partido.id === id);

  aplicar(
    (previo) => ({
      ...previo,
      partidos: previo.partidos.filter((partido) => partido.id !== id),
    }),
    () => bajarPartido(id),
  );

  if (borrado) anotar("partido", "baja", id, { antes: borrado });
}

function exportar(): string {
  return JSON.stringify(instantanea.estado, null, 2);
}

function importar(crudo: string): { ok: boolean; error?: string } {
  try {
    const dato = normalizar(JSON.parse(crudo));
    if (!dato)
      return {
        ok: false,
        error: "El archivo no tiene el formato de una liga.",
      };
    aplicar(
      () => dato,
      () => reemplazarTodo(dato),
    );
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "No se pudo leer el archivo: no es un JSON válido.",
    };
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
  const { estado, hidratado, guardado, sembrada, presentacion, quien } = useSyncExternalStore(
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
    /** De quién es este dispositivo: todo lo que se carga queda a su nombre. */
    quien,
    elegirQuien,
    olvidarQuien,
    presentarseComoNuevo,
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
