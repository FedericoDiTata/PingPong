import type { Game } from "./types";

export type Lado = "a" | "b";

export type EstadoVivo = {
  games: Game[];
  actual: Game;
  setsA: number;
  setsB: number;
  terminado: boolean;
  ganador: Lado | null;
  puntoDeGame: Lado | null;
  puntoDePartido: Lado | null;
  deuce: boolean;
  saca: Lado;
  numeroGame: number;
};

export const otroLado = (lado: Lado): Lado => (lado === "a" ? "b" : "a");

export const setsParaGanar = (alMejorDe: number) => Math.ceil(alMejorDe / 2);

/**
 * Regla oficial: el saque cambia cada 2 puntos, y cada 1 a partir del empate
 * en meta-1 (el 10-10 clásico). El saque inicial alterna en cada game.
 */
export function saqueDe(inicial: Lado, a: number, b: number, meta: number): Lado {
  const total = a + b;
  const umbral = (meta - 1) * 2;

  const cambios =
    total <= umbral ? Math.floor(total / 2) : Math.floor(umbral / 2) + (total - umbral);

  return cambios % 2 === 0 ? inicial : otroLado(inicial);
}

const gameCerrado = (a: number, b: number, meta: number) =>
  (a >= meta || b >= meta) && Math.abs(a - b) >= 2;

/**
 * Todo el partido se deriva de la lista de puntos. Deshacer es sacar el último
 * de la lista: no hay estados intermedios que puedan quedar desincronizados.
 */
export function reconstruir(
  puntos: Lado[],
  meta: number,
  alMejorDe: number,
  saqueInicial: Lado,
): EstadoVivo {
  const objetivo = setsParaGanar(alMejorDe);
  const games: Game[] = [];
  let a = 0;
  let b = 0;
  let setsA = 0;
  let setsB = 0;
  let terminado = false;

  for (const punto of puntos) {
    if (terminado) break;
    if (punto === "a") a += 1;
    else b += 1;

    if (gameCerrado(a, b, meta)) {
      games.push({ a, b });
      if (a > b) setsA += 1;
      else setsB += 1;
      a = 0;
      b = 0;
      if (setsA >= objetivo || setsB >= objetivo) terminado = true;
    }
  }

  const numeroGame = games.length + 1;
  const saqueDelGame = games.length % 2 === 0 ? saqueInicial : otroLado(saqueInicial);

  const aTieneGame = a >= meta - 1 && a - b >= 1;
  const bTieneGame = b >= meta - 1 && b - a >= 1;
  const puntoDeGame = terminado ? null : aTieneGame ? "a" : bTieneGame ? "b" : null;

  const puntoDePartido =
    puntoDeGame === "a" && setsA === objetivo - 1
      ? "a"
      : puntoDeGame === "b" && setsB === objetivo - 1
        ? "b"
        : null;

  return {
    games,
    actual: { a, b },
    setsA,
    setsB,
    terminado,
    ganador: terminado ? (setsA > setsB ? "a" : "b") : null,
    puntoDeGame,
    puntoDePartido,
    deuce: !terminado && a >= meta - 1 && b >= meta - 1 && a === b,
    saca: saqueDe(saqueDelGame, a, b, meta),
    numeroGame,
  };
}
