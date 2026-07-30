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
export type NivelDetalle = "simple" | "puntos";

export type Estado = {
  version: number;
  jugadores: Jugador[];
  partidos: Partido[];
};

export const ESTADO_VACIO: Estado = {
  version: 2,
  jugadores: [],
  partidos: [],
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
