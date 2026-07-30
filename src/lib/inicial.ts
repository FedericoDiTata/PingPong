import type { Estado, Jugador, Partido } from "./types";

/**
 * La liga arranca con el historial que ya venía anotado a mano.
 *
 * De estos partidos sólo se sabe quién ganó: son los que se venían llevando de
 * memoria, sin marcador. Los cruces están cargados como totales acumulados y
 * acá se reparten en partidos sueltos, porque el ranking necesita un orden
 * para ir moviendo el puntaje.
 */

const PLANTEL: Array<Omit<Jugador, "creadoEn">> = [
  { id: "fede", nombre: "Fede", emoji: "🏓" },
  { id: "chris", nombre: "Chris", emoji: "🦊" },
  { id: "ernes", nombre: "Ernes", emoji: "🐉" },
  { id: "fer", nombre: "Fer", emoji: "⚡" },
];

/** Totales del historial hasta julio de 2026. */
const CRUCES: Array<{ a: string; b: string; ganoA: number; ganoB: number }> = [
  { a: "fer", b: "chris", ganoA: 13, ganoB: 10 },
  { a: "fer", b: "ernes", ganoA: 8, ganoB: 7 },
  { a: "fede", b: "fer", ganoA: 11, ganoB: 10 },
  { a: "fede", b: "chris", ganoA: 6, ganoB: 4 },
  { a: "ernes", b: "fede", ganoA: 6, ganoB: 1 },
];

/** Ventana en la que se reparten los partidos viejos. */
const DESDE = Date.UTC(2026, 1, 16, 19, 0);
const HASTA = Date.UTC(2026, 6, 28, 19, 0);

function azar(semilla: number) {
  let estado = semilla >>> 0;
  return () => {
    estado += 0x6d2b79f5;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Reparte las victorias de un cruce a lo largo de la serie en vez de apilarlas.
 * Sin esto, "Fer 13 - Chris 10" se convertiría en trece triunfos al hilo de Fer
 * y después diez de Chris: rachas falsas que ensucian todas las estadísticas.
 */
function repartir(a: string, b: string, ganoA: number, ganoB: number, rand: () => number) {
  const total = ganoA + ganoB;
  const serie: string[] = [];

  let acumulado = 0;
  for (let i = 1; i <= total; i += 1) {
    const objetivo = Math.round((ganoA * i) / total);
    if (acumulado < objetivo) {
      serie.push(a);
      acumulado += 1;
    } else {
      serie.push(b);
    }
  }

  // Intercambios chicos: rompen la alternancia perfecta sin tocar los totales.
  for (let i = 0; i < serie.length - 1; i += 1) {
    if (rand() < 0.32) [serie[i], serie[i + 1]] = [serie[i + 1], serie[i]];
  }

  return serie;
}

/**
 * Reconoce la liga de ejemplo que traía la versión anterior (Vicky, Zikiel,
 * Tincho y compañía). Quedó guardada en los navegadores donde alguien tocó
 * "Ver ejemplo", y como la siembra sólo corre cuando no hay nada, esos
 * navegadores nunca llegaban a ver el historial real.
 *
 * Sólo se considera de ejemplo si TODOS los jugadores son de ejemplo: si
 * alguien ya sumó gente de verdad encima, no se toca nada.
 */
export function esLigaDeEjemplo(estado: Estado): boolean {
  return (
    estado.jugadores.length > 0 &&
    estado.jugadores.every((jugador) => jugador.id.startsWith("demo-"))
  );
}

export function ligaInicial(): Estado {
  const rand = azar(30072026);

  const jugadores: Jugador[] = PLANTEL.map((persona, indice) => ({
    ...persona,
    creadoEn: new Date(DESDE - (PLANTEL.length - indice) * 86_400_000).toISOString(),
  }));

  // Cada cruce es una cola que mantiene su orden interno.
  const colas = CRUCES.map((cruce) => ({
    a: cruce.a,
    b: cruce.b,
    pendientes: repartir(cruce.a, cruce.b, cruce.ganoA, cruce.ganoB, rand),
  }));

  // Se van sacando partidos de una cola al azar: las rivalidades avanzan en
  // paralelo, como pasó de verdad, y no una serie entera detrás de la otra.
  const orden: Array<{ a: string; b: string; ganador: string }> = [];
  let restantes = colas.reduce((suma, cola) => suma + cola.pendientes.length, 0);

  while (restantes > 0) {
    let tirada = rand() * restantes;
    for (const cola of colas) {
      if (tirada < cola.pendientes.length) {
        orden.push({ a: cola.a, b: cola.b, ganador: cola.pendientes.shift()! });
        restantes -= 1;
        break;
      }
      tirada -= cola.pendientes.length;
    }
  }

  const paso = (HASTA - DESDE) / Math.max(orden.length - 1, 1);

  const partidos: Partido[] = orden.map((duelo, indice) => ({
    id: `historial-${indice + 1}`,
    jugadorA: duelo.a,
    jugadorB: duelo.b,
    ganador: duelo.ganador,
    // Repartidos parejo en la ventana, con un desvío de hasta medio paso para
    // que no queden clavados a intervalos exactos.
    jugadoEn: new Date(DESDE + paso * indice + (rand() - 0.5) * paso).toISOString(),
  }));

  return { version: 2, jugadores, partidos };
}
