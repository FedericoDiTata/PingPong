/**
 * Nivel de cada jugador, con el método Bradley-Terry.
 *
 * El problema que resuelve: acá los partidos se cargan de memoria, en desorden,
 * un rato después de jugarlos. Un sistema tipo ELO va sumando y restando partido
 * por partido, así que el resultado depende del orden en que se cargaron — y con
 * los mismos partidos en otro orden, cualquiera podía terminar primero o último.
 *
 * Bradley-Terry no recorre nada: mira todos los resultados juntos y busca el
 * nivel de cada uno que mejor los explica. Si A le gana seguido a B, y B le gana
 * seguido a C, entonces A tiene que estar bastante arriba de C aunque casi no
 * hayan jugado entre ellos. Cargar los mismos partidos en otro orden da
 * exactamente el mismo resultado.
 *
 * La escala es directa de leer: el nivel es la probabilidad, de 0 a 100, de
 * ganarle a un jugador promedio. 50 es el promedio exacto.
 */

/** Nivel de un jugador promedio. Es el ancla de la escala. */
export const NIVEL_PROMEDIO = 50;

/**
 * Victorias y derrotas virtuales contra un rival promedio con las que entra
 * cada jugador. Sin esto, alguien con dos partidos y dos victorias daría nivel
 * 100 y se comería la tabla; con esto hace falta ganar seguido y bastante para
 * despegarse. Es el equivalente a "todavía no jugaste lo suficiente".
 */
const PARTIDOS_DE_ARRANQUE = 1.5;

export type Duelo = { ganador: string; perdedor: string };

/**
 * Devuelve el nivel (0 a 100) de cada jugador.
 *
 * Usa el algoritmo MM de Hunter (2004), que es el estándar para ajustar
 * Bradley-Terry: se arranca suponiendo que todos son iguales y se corrige la
 * fuerza de cada uno hasta que los números dejan de moverse.
 */
export function calcularNiveles(
  jugadorIds: readonly string[],
  duelos: readonly Duelo[],
): Record<string, number> {
  const fuerza: Record<string, number> = {};
  const victorias: Record<string, number> = {};
  const cruces: Record<string, Record<string, number>> = {};

  for (const id of jugadorIds) {
    fuerza[id] = 1;
    victorias[id] = 0;
    cruces[id] = {};
  }

  for (const duelo of duelos) {
    if (fuerza[duelo.ganador] === undefined || fuerza[duelo.perdedor] === undefined) continue;
    victorias[duelo.ganador] += 1;
    cruces[duelo.ganador][duelo.perdedor] = (cruces[duelo.ganador][duelo.perdedor] ?? 0) + 1;
    cruces[duelo.perdedor][duelo.ganador] = (cruces[duelo.perdedor][duelo.ganador] ?? 0) + 1;
  }

  for (let vuelta = 0; vuelta < 500; vuelta += 1) {
    let movimiento = 0;

    for (const id of jugadorIds) {
      let divisor = 0;
      for (const rival of jugadorIds) {
        if (rival === id) continue;
        const jugados = cruces[id][rival] ?? 0;
        if (jugados > 0) divisor += jugados / (fuerza[id] + fuerza[rival]);
      }
      // Los partidos virtuales contra el promedio, que tiene fuerza 1.
      divisor += (2 * PARTIDOS_DE_ARRANQUE) / (fuerza[id] + 1);

      const nueva = (victorias[id] + PARTIDOS_DE_ARRANQUE) / divisor;
      movimiento = Math.max(movimiento, Math.abs(nueva - fuerza[id]) / fuerza[id]);
      fuerza[id] = nueva;
    }

    if (movimiento < 1e-12) break;
  }

  const niveles: Record<string, number> = {};
  for (const id of jugadorIds) {
    // Un decimal, no entero: con cien partidos encima, un partido nuevo mueve
    // menos de un punto. Redondeado a entero no se vería nunca, y ganar tiene
    // que notarse.
    niveles[id] = Math.round((fuerza[id] / (fuerza[id] + 1)) * 1000) / 10;
  }
  return niveles;
}
