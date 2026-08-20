export type Jugador = {
  id: string;
  nombre: string;
  emoji: string;
  creadoEn: string;
};

/**
 * Todos los partidos son a un game de 11. Lo único obligatorio es quién ganó:
 * así es como quedan la mayoría de los resultados en la vida real ("le ganó
 * Fede" y listo). El marcador exacto es opcional y se carga cuando se acuerdan.
 */
export type Partido = {
  id: string;
  jugadorA: string;
  jugadorB: string;
  ganador: string;
  puntosA?: number;
  puntosB?: number;
  jugadoEn: string;
};

/** "simple" = sabemos quién ganó · "puntos" = sabemos el marcador exacto. */
export type DetalleMarcador = "simple" | "puntos";

/**
 * Quién dice ser el que está usando la app en este dispositivo.
 *
 * Es una declaración, no una identidad verificada: sin cuentas, nadie impide
 * decir que sos otro. Alcanza para lo que se busca, que es saber quién anotó
 * qué, no atrapar a un mentiroso.
 */
export type Quien = { id: string; nombre: string };

export type TipoMovimiento = "alta" | "edicion" | "baja";
export type EntidadMovimiento = "partido" | "jugador";

/**
 * Una línea del registro: quién tocó qué y cuándo.
 *
 * Guarda el nombre además del id porque el registro tiene que seguir teniendo
 * sentido dentro de un año, aunque esa persona se haya ido de la liga o se haya
 * cambiado el nombre. Por lo mismo `antes` y `despues` son fotos completas: un
 * partido borrado ya no existe en ningún lado más que acá.
 */
export type Movimiento = {
  id: string;
  entidad: EntidadMovimiento;
  tipo: TipoMovimiento;
  /** Id del partido o del jugador afectado. */
  sobre: string;
  quienId: string | null;
  quienNombre: string;
  antes?: Partido | Jugador;
  despues?: Partido | Jugador;
  cuando: string;
};

export type Estado = {
  version: number;
  jugadores: Jugador[];
  partidos: Partido[];
  movimientos: Movimiento[];
};

export const ESTADO_VACIO: Estado = {
  version: 2,
  jugadores: [],
  partidos: [],
  movimientos: [],
};

/** Puntos para ganar un game. Fijo: la liga entera se juega así. */
export const META = 11;

export const EMOJIS = [
  "🏓",
  "🔥",
  "🐉",
  "🦊",
  "🦈",
  "🐺",
  "🦅",
  "🐢",
  "🦍",
  "👑",
  "💀",
  "🎯",
  "⚡",
  "🌶️",
  "🧊",
  "🥷",
  "🤖",
  "🍕",
  "🧉",
  "🐍",
] as const;
