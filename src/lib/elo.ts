/**
 * Puntaje de la liga. Es un ELO (el sistema del ajedrez) con cuatro cambios
 * pensados para una liga chica de amigos:
 *
 * 1. Todos arrancan en 50 y nadie puede quedar en negativo: no se puede perder
 *    lo que no se tiene. El que llega a cero no baja más, sólo puede subir.
 * 2. El factor K arranca alto y baja con los partidos jugados: los primeros
 *    resultados mueven mucho la aguja para que la tabla se ordene rápido, y
 *    después se estabiliza para que no la dé vuelta un partido suelto.
 * 3. Una paliza vale un poco más, pero sólo si se cargó el marcador. Si el
 *    partido se anotó sin puntos, cuenta como uno normal: nadie tiene que
 *    anotar el resultado exacto para que la liga funcione.
 * 4. Ganarle a alguien que está arriba tuyo suma más que ganarle a alguien que
 *    está abajo, y perder contra alguien de abajo cuesta más.
 *
 * Sobre el 50: el piso en cero es lo único que rompe la simetría del ELO
 * clásico, porque cuando el perdedor no tiene con qué pagar el ganador igual se
 * lleva lo suyo y el sistema infla. Arrancar con colchón hace que eso casi no
 * pase: con el historial de esta liga, el piso se toca tres veces en 76
 * partidos, todas en los primeros. Empezar en 0 también funciona (nadie termina
 * amontonado en cero), así que este número se puede cambiar sin miedo.
 */

export const PUNTOS_INICIAL = 50;

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

export function variacionPuntos(params: {
  puntosGanador: number;
  puntosPerdedor: number;
  partidosGanador: number;
  partidosPerdedor: number;
  /** Diferencia del marcador (11-8 → 3). `null` si el partido se cargó sin puntos. */
  margenDelMarcador: number | null;
}): { ganador: number; perdedor: number } {
  const esperado = probabilidadEsperada(params.puntosGanador, params.puntosPerdedor);
  const margen = multiplicadorMargen(params.margenDelMarcador);

  const sube = Math.round(factorK(params.partidosGanador) * (1 - esperado) * margen);
  const bajaSugerida = Math.round(factorK(params.partidosPerdedor) * (1 - esperado) * margen);

  return {
    ganador: sube,
    perdedor: -Math.min(bajaSugerida, params.puntosPerdedor),
  };
}
