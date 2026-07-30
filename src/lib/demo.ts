import type { Estado, Jugador, Partido } from "./types";

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
 * Simula el game punto por punto en vez de inventar el resultado final.
 * Sale gratis y produce marcadores creíbles: 11-8, 13-11, 11-4.
 */
function jugarGame(probA: number, rand: () => number): { a: number; b: number } {
  let a = 0;
  let b = 0;
  while (true) {
    if (rand() < probA) a += 1;
    else b += 1;
    if ((a >= 11 || b >= 11) && Math.abs(a - b) >= 2) return { a, b };
  }
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
  const total = 42;

  for (let i = 0; i < total; i += 1) {
    const a = Math.floor(rand() * PLANTEL.length);
    let b = Math.floor(rand() * PLANTEL.length);
    while (b === a) b = Math.floor(rand() * PLANTEL.length);

    const ventaja = PLANTEL[a].nivel - PLANTEL[b].nivel;
    const probA = Math.min(0.68, Math.max(0.32, 0.5 + ventaja * 1.6));
    const marcador = jugarGame(probA, rand);

    // Como en la vida real: de la mayoría sólo queda quién ganó.
    const seAcuerdanElMarcador = rand() < 0.35;

    const diasAtras = 34 - i * 0.8 - rand() * 0.5;
    const jugadoEn = new Date(
      ahora - diasAtras * 86_400_000 + (rand() * 4 - 2) * 3_600_000,
    ).toISOString();

    partidos.push({
      id: `demo-p-${i + 1}`,
      jugadorA: jugadores[a].id,
      jugadorB: jugadores[b].id,
      ganador: marcador.a > marcador.b ? jugadores[a].id : jugadores[b].id,
      ...(seAcuerdanElMarcador ? { puntosA: marcador.a, puntosB: marcador.b } : {}),
      jugadoEn,
    });
  }

  return { version: 2, jugadores, partidos };
}
