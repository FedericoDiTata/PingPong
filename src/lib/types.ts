export type Jugador = {
  id: string;
  nombre: string;
  emoji: string;
  creadoEn: string;
};

/** Puntos de un game individual. `a` corresponde a `partido.jugadorA`. */
export type Game = {
  a: number;
  b: number;
};

export type Partido = {
  id: string;
  jugadorA: string;
  jugadorB: string;
  games: Game[];
  /** ISO. Cuándo se jugó, no cuándo se cargó. */
  jugadoEn: string;
  origen: "vivo" | "manual";
  /** Puntos para ganar un game (11 o 21). */
  meta: number;
};

export type Estado = {
  version: number;
  jugadores: Jugador[];
  partidos: Partido[];
};

export const ESTADO_VACIO: Estado = {
  version: 1,
  jugadores: [],
  partidos: [],
};

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
