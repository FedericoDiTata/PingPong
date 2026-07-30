import type { Estado, Game, Jugador, Partido } from "./types";

/** Generador determinístico: los datos de ejemplo son siempre los mismos. */
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
 * Simula un game punto por punto en vez de inventar el resultado final.
 * Sale gratis y produce marcadores creíbles: 11-8, 12-10, 11-4, con deuces.
 */
function jugarGame(probA: number, rand: () => number): Game {
  let a = 0;
  let b = 0;
  while (true) {
    if (rand() < probA) a += 1;
    else b += 1;
    if ((a >= 11 || b >= 11) && Math.abs(a - b) >= 2) return { a, b };
  }
}

function jugarPartido(probA: number, rand: () => number): Game[] {
  const games: Game[] = [];
  let setsA = 0;
  let setsB = 0;
  while (setsA < 3 && setsB < 3) {
    const game = jugarGame(probA, rand);
    games.push(game);
    if (game.a > game.b) setsA += 1;
    else setsB += 1;
  }
  return games;
}

const PLANTEL: Array<{ nombre: string; emoji: string; nivel: number }> = [
  { nombre: "Fede", emoji: "🏓", nivel: 0.56 },
  { nombre: "Zikiel", emoji: "🐉", nivel: 0.53 },
  { nombre: "Nacho", emoji: "🦊", nivel: 0.47 },
  { nombre: "Sofi", emoji: "⚡", nivel: 0.54 },
  { nombre: "Tincho", emoji: "🧉", nivel: 0.44 },
  { nombre: "Vicky", emoji: "🌶️", nivel: 0.5 },
];

export function generarDemo(): Estado {
  const rand = azar(20260730);
  const ahora = Date.now();

  const jugadores: Jugador[] = PLANTEL.map((persona, indice) => ({
    id: `demo-${indice + 1}`,
    nombre: persona.nombre,
    emoji: persona.emoji,
    creadoEn: new Date(ahora - 40 * 86_400_000 + indice * 3_600_000).toISOString(),
  }));

  const partidos: Partido[] = [];
  const total = 26;

  for (let i = 0; i < total; i += 1) {
    const a = Math.floor(rand() * PLANTEL.length);
    let b = Math.floor(rand() * PLANTEL.length);
    while (b === a) b = Math.floor(rand() * PLANTEL.length);

    const ventaja = PLANTEL[a].nivel - PLANTEL[b].nivel;
    const probA = Math.min(0.68, Math.max(0.32, 0.5 + ventaja * 1.6));

    // De más viejo a más nuevo, con huecos irregulares para que no parezca
    // una grilla perfecta de partidos cada 24 horas exactas.
    const diasAtras = 34 - i * 1.3 - rand() * 0.8;
    const jugadoEn = new Date(
      ahora - diasAtras * 86_400_000 + (rand() * 4 - 2) * 3_600_000,
    ).toISOString();

    partidos.push({
      id: `demo-p-${i + 1}`,
      jugadorA: jugadores[a].id,
      jugadorB: jugadores[b].id,
      games: jugarPartido(probA, rand),
      jugadoEn,
      origen: rand() > 0.45 ? "vivo" : "manual",
      meta: 11,
    });
  }

  return { version: 1, jugadores, partidos };
}
