import { ELO_INICIAL, variacionElo } from "./elo";
import type { Estado, Jugador, Partido } from "./types";

export type ResultadoPartido = {
  partido: Partido;
  setsA: number;
  setsB: number;
  puntosA: number;
  puntosB: number;
  ganadorId: string;
  perdedorId: string;
  eloAntes: { a: number; b: number };
  eloDespues: { a: number; b: number };
  delta: { a: number; b: number };
};

export type PuntoHistoria = {
  partidoId: string;
  fecha: string;
  elo: number;
  delta: number;
  gano: boolean;
};

export type Racha = { tipo: "G" | "P" | null; largo: number };

export type StatsJugador = {
  jugador: Jugador;
  elo: number;
  pico: number;
  pj: number;
  pg: number;
  pp: number;
  efectividad: number;
  setsGanados: number;
  setsPerdidos: number;
  puntosGanados: number;
  puntosPerdidos: number;
  difPuntos: number;
  racha: Racha;
  mejorRacha: number;
  forma: Array<"G" | "P">;
  historia: PuntoHistoria[];
  h2h: Record<string, { pg: number; pp: number }>;
  ultimoPartido: string | null;
};

export type FilaTabla = StatsJugador & {
  puesto: number;
  deltaPuesto: number;
};

export type Liga = {
  jugadores: Jugador[];
  porId: Record<string, Jugador>;
  resultados: ResultadoPartido[];
  recientes: ResultadoPartido[];
  tabla: FilaTabla[];
  sinJugar: StatsJugador[];
  stats: Record<string, StatsJugador>;
  totalPartidos: number;
  totalPuntos: number;
};

/** Sets y puntos de un partido, sin tocar ELO. */
export function resolver(partido: Partido) {
  let setsA = 0;
  let setsB = 0;
  let puntosA = 0;
  let puntosB = 0;

  for (const game of partido.games) {
    puntosA += game.a;
    puntosB += game.b;
    if (game.a > game.b) setsA += 1;
    else if (game.b > game.a) setsB += 1;
  }

  const ganaA = setsA === setsB ? puntosA >= puntosB : setsA > setsB;

  return {
    setsA,
    setsB,
    puntosA,
    puntosB,
    ganadorId: ganaA ? partido.jugadorA : partido.jugadorB,
    perdedorId: ganaA ? partido.jugadorB : partido.jugadorA,
  };
}

function cronologico(partidos: Partido[]): Partido[] {
  return [...partidos].sort((x, y) => {
    if (x.jugadoEn === y.jugadoEn) return x.id < y.id ? -1 : 1;
    return x.jugadoEn < y.jugadoEn ? -1 : 1;
  });
}

function statsVacias(jugador: Jugador): StatsJugador {
  return {
    jugador,
    elo: ELO_INICIAL,
    pico: ELO_INICIAL,
    pj: 0,
    pg: 0,
    pp: 0,
    efectividad: 0,
    setsGanados: 0,
    setsPerdidos: 0,
    puntosGanados: 0,
    puntosPerdidos: 0,
    difPuntos: 0,
    racha: { tipo: null, largo: 0 },
    mejorRacha: 0,
    forma: [],
    historia: [],
    h2h: {},
    ultimoPartido: null,
  };
}

/** Reproduce todos los partidos en orden y devuelve el estado de cada jugador. */
function simular(jugadores: Jugador[], partidos: Partido[]) {
  const stats: Record<string, StatsJugador> = {};
  for (const jugador of jugadores) stats[jugador.id] = statsVacias(jugador);

  const resultados: ResultadoPartido[] = [];

  for (const partido of cronologico(partidos)) {
    const a = stats[partido.jugadorA];
    const b = stats[partido.jugadorB];
    if (!a || !b) continue;

    const base = resolver(partido);
    const ganaA = base.ganadorId === partido.jugadorA;

    const cambio = variacionElo({
      eloGanador: ganaA ? a.elo : b.elo,
      eloPerdedor: ganaA ? b.elo : a.elo,
      partidosGanador: ganaA ? a.pj : b.pj,
      partidosPerdedor: ganaA ? b.pj : a.pj,
      setsGanador: Math.max(base.setsA, base.setsB),
      setsPerdedor: Math.min(base.setsA, base.setsB),
    });

    const deltaA = ganaA ? cambio.ganador : cambio.perdedor;
    const deltaB = ganaA ? cambio.perdedor : cambio.ganador;

    const resultado: ResultadoPartido = {
      partido,
      ...base,
      eloAntes: { a: a.elo, b: b.elo },
      eloDespues: { a: a.elo + deltaA, b: b.elo + deltaB },
      delta: { a: deltaA, b: deltaB },
    };
    resultados.push(resultado);

    aplicar(a, {
      delta: deltaA,
      gano: ganaA,
      rival: b.jugador.id,
      setsPropios: base.setsA,
      setsRival: base.setsB,
      puntosPropios: base.puntosA,
      puntosRival: base.puntosB,
      partidoId: partido.id,
      fecha: partido.jugadoEn,
    });

    aplicar(b, {
      delta: deltaB,
      gano: !ganaA,
      rival: a.jugador.id,
      setsPropios: base.setsB,
      setsRival: base.setsA,
      puntosPropios: base.puntosB,
      puntosRival: base.puntosA,
      partidoId: partido.id,
      fecha: partido.jugadoEn,
    });
  }

  for (const stat of Object.values(stats)) {
    stat.efectividad = stat.pj > 0 ? stat.pg / stat.pj : 0;
    stat.difPuntos = stat.puntosGanados - stat.puntosPerdidos;
    stat.forma = stat.historia
      .slice(-5)
      .reverse()
      .map((punto) => (punto.gano ? "G" : "P"));

    const ultima = stat.historia.at(-1);
    stat.ultimoPartido = ultima?.fecha ?? null;

    let largo = 0;
    let tipo: "G" | "P" | null = null;
    for (let i = stat.historia.length - 1; i >= 0; i -= 1) {
      const marca = stat.historia[i].gano ? "G" : "P";
      if (tipo === null) tipo = marca;
      if (marca !== tipo) break;
      largo += 1;
    }
    stat.racha = { tipo, largo };

    let corriendo = 0;
    for (const punto of stat.historia) {
      corriendo = punto.gano ? corriendo + 1 : 0;
      if (corriendo > stat.mejorRacha) stat.mejorRacha = corriendo;
    }
  }

  return { stats, resultados };
}

function aplicar(
  stat: StatsJugador,
  datos: {
    delta: number;
    gano: boolean;
    rival: string;
    setsPropios: number;
    setsRival: number;
    puntosPropios: number;
    puntosRival: number;
    partidoId: string;
    fecha: string;
  },
) {
  stat.elo += datos.delta;
  stat.pico = Math.max(stat.pico, stat.elo);
  stat.pj += 1;
  if (datos.gano) stat.pg += 1;
  else stat.pp += 1;
  stat.setsGanados += datos.setsPropios;
  stat.setsPerdidos += datos.setsRival;
  stat.puntosGanados += datos.puntosPropios;
  stat.puntosPerdidos += datos.puntosRival;

  const cruce = stat.h2h[datos.rival] ?? { pg: 0, pp: 0 };
  if (datos.gano) cruce.pg += 1;
  else cruce.pp += 1;
  stat.h2h[datos.rival] = cruce;

  stat.historia.push({
    partidoId: datos.partidoId,
    fecha: datos.fecha,
    elo: stat.elo,
    delta: datos.delta,
    gano: datos.gano,
  });
}

/** ELO, después partidos ganados, después diferencia de puntos, después alfabético. */
function ordenar(lista: StatsJugador[]): StatsJugador[] {
  return [...lista].sort((x, y) => {
    if (y.elo !== x.elo) return y.elo - x.elo;
    if (y.pg !== x.pg) return y.pg - x.pg;
    if (y.difPuntos !== x.difPuntos) return y.difPuntos - x.difPuntos;
    return x.jugador.nombre.localeCompare(y.jugador.nombre, "es");
  });
}

export function computarLiga(estado: Estado): Liga {
  const { stats, resultados } = simular(estado.jugadores, estado.partidos);

  const conPartidos = Object.values(stats).filter((stat) => stat.pj > 0);
  const ordenados = ordenar(conPartidos);

  // El puesto de antes del último partido cargado: así la flecha de subida o
  // bajada dice algo concreto ("esto te movió el último partido"), no un
  // promedio abstracto.
  const previos = new Map<string, number>();
  if (estado.partidos.length > 1) {
    const historicos = cronologico(estado.partidos).slice(0, -1);
    const anterior = simular(estado.jugadores, historicos);
    ordenar(Object.values(anterior.stats).filter((stat) => stat.pj > 0)).forEach((stat, indice) => {
      previos.set(stat.jugador.id, indice + 1);
    });
  }

  const tabla: FilaTabla[] = ordenados.map((stat, indice) => {
    const puesto = indice + 1;
    const previo = previos.get(stat.jugador.id);
    return {
      ...stat,
      puesto,
      deltaPuesto: previo === undefined ? 0 : previo - puesto,
    };
  });

  const sinJugar = Object.values(stats)
    .filter((stat) => stat.pj === 0)
    .sort((x, y) => x.jugador.nombre.localeCompare(y.jugador.nombre, "es"));

  const porId: Record<string, Jugador> = {};
  for (const jugador of estado.jugadores) porId[jugador.id] = jugador;

  return {
    jugadores: estado.jugadores,
    porId,
    resultados,
    recientes: [...resultados].reverse(),
    tabla,
    sinJugar,
    stats,
    totalPartidos: resultados.length,
    totalPuntos: resultados.reduce((suma, r) => suma + r.puntosA + r.puntosB, 0),
  };
}

/** Cruce directo entre dos jugadores, del más nuevo al más viejo. */
export function historialCruce(liga: Liga, unoId: string, otroId: string): ResultadoPartido[] {
  return liga.recientes.filter(
    (r) =>
      (r.partido.jugadorA === unoId && r.partido.jugadorB === otroId) ||
      (r.partido.jugadorA === otroId && r.partido.jugadorB === unoId),
  );
}
