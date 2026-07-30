/**
 * Sistema de puntaje ELO adaptado a una liga chica de amigos.
 *
 * Tres decisiones que se apartan del ELO clásico de ajedrez:
 *
 * 1. Todos arrancan en 1000 (número redondo, fácil de leer de un vistazo).
 * 2. El factor K arranca alto y baja con los partidos jugados: los primeros
 *    resultados mueven mucho la aguja para que el ranking se ordene rápido,
 *    y después se estabiliza para que no lo dé vuelta un partido suelto.
 * 3. Ganar 3-0 vale más que ganar 3-2. El multiplicador de margen premia la
 *    diferencia de sets sin que una paliza rompa la escala.
 */

export const ELO_INICIAL = 1000;

export function factorK(partidosJugados: number): number {
  if (partidosJugados < 5) return 48;
  if (partidosJugados < 15) return 32;
  return 24;
}

/** Probabilidad de que gane quien tiene `propio` frente a quien tiene `rival`. */
export function probabilidadEsperada(propio: number, rival: number): number {
  return 1 / (1 + Math.pow(10, (rival - propio) / 400));
}

/** 2-0 → 1.12 · 3-1 → 1.12 · 3-0 → 1.24 · 3-2 → 1.00 */
export function multiplicadorMargen(setsGanador: number, setsPerdedor: number): number {
  return 1 + 0.12 * Math.max(0, setsGanador - setsPerdedor - 1);
}

export function variacionElo(params: {
  eloGanador: number;
  eloPerdedor: number;
  partidosGanador: number;
  partidosPerdedor: number;
  setsGanador: number;
  setsPerdedor: number;
}): { ganador: number; perdedor: number } {
  const esperado = probabilidadEsperada(params.eloGanador, params.eloPerdedor);
  const margen = multiplicadorMargen(params.setsGanador, params.setsPerdedor);

  const subeGanador = factorK(params.partidosGanador) * (1 - esperado) * margen;
  const bajaPerdedor = factorK(params.partidosPerdedor) * (1 - esperado) * margen;

  return {
    ganador: Math.round(subeGanador),
    perdedor: -Math.round(bajaPerdedor),
  };
}

/**
 * Cuántos puntos se llevaría cada uno si el partido terminara así.
 * Se usa para la previsualización antes de guardar.
 */
export function proyeccion(eloA: number, eloB: number): { siGanaA: number; siGanaB: number } {
  return {
    siGanaA: Math.round(32 * (1 - probabilidadEsperada(eloA, eloB))),
    siGanaB: Math.round(32 * (1 - probabilidadEsperada(eloB, eloA))),
  };
}
