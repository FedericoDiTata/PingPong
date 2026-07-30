/**
 * Puntaje ELO adaptado a una liga chica de amigos.
 *
 * Tres decisiones que se apartan del ELO clásico de ajedrez:
 *
 * 1. Todos arrancan en 1000 (número redondo, fácil de leer de un vistazo).
 * 2. El factor K arranca alto y baja con los partidos jugados: los primeros
 *    resultados mueven mucho la aguja para que el ranking se ordene rápido,
 *    y después se estabiliza para que no lo dé vuelta un partido suelto.
 * 3. Una paliza vale un poco más que un partido peleado, pero sólo si sabemos
 *    el marcador. Si el partido se cargó sin puntos, cuenta como uno normal:
 *    nadie tiene que anotar el resultado exacto para que la liga funcione.
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

/** 11-9 → 1.00 · 11-5 → 1.08 · 11-0 → 1.14 (tope 1.15). */
export function multiplicadorMargen(diferencia: number | null): number {
  if (diferencia === null) return 1;
  return Math.min(1.15, 1 + 0.0175 * Math.max(0, diferencia - 2));
}

export function variacionElo(params: {
  eloGanador: number;
  eloPerdedor: number;
  partidosGanador: number;
  partidosPerdedor: number;
  diferenciaPuntos: number | null;
}): { ganador: number; perdedor: number } {
  const esperado = probabilidadEsperada(params.eloGanador, params.eloPerdedor);
  const margen = multiplicadorMargen(params.diferenciaPuntos);

  return {
    ganador: Math.round(factorK(params.partidosGanador) * (1 - esperado) * margen),
    perdedor: -Math.round(factorK(params.partidosPerdedor) * (1 - esperado) * margen),
  };
}

/** Cuántos puntos se llevaría cada uno según quién gane. Para previsualizar. */
export function proyeccion(eloA: number, eloB: number, pjA: number, pjB: number) {
  return {
    siGanaA: Math.round(factorK(pjA) * (1 - probabilidadEsperada(eloA, eloB))),
    siGanaB: Math.round(factorK(pjB) * (1 - probabilidadEsperada(eloB, eloA))),
  };
}
