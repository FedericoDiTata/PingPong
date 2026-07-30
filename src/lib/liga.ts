import { ELO_INICIAL, variacionElo } from "./elo";
import type { Estado, Jugador, NivelDetalle, Partido } from "./types";

export type ResultadoPartido = {
  partido: Partido;
  detalle: NivelDetalle;
  ganadorId: string;
  perdedorId: string;
  /** Puntos del ganador y del perdedor, si se cargaron. */
  puntosGanador: number | null;
  puntosPerdedor: number | null;
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
  rival: string;
};

export type Racha = { tipo: "G" | "P" | null; largo: number };

export type Cruce = {
  rival: Jugador;
  pg: number;
  pp: number;
  total: number;
};

export type StatsJugador = {
  jugador: Jugador;
  elo: number;
  pico: number;
  pj: number;
  pg: number;
  pp: number;
  efectividad: number;
  puntosGanados: number;
  puntosPerdidos: number;
  partidosConPuntos: number;
  racha: Racha;
  mejorRacha: number;
  peorRacha: number;
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
  totalConPuntos: number;
};

/** Quién ganó, quién perdió y con qué marcador (si se sabe). */
export function resolver(partido: Partido) {
  const ganoA = partido.ganador === partido.jugadorA;
  const perdedorId = ganoA ? partido.jugadorB : partido.jugadorA;

  const tienePuntos =
    typeof partido.puntosA === "number" && typeof partido.puntosB === "number";

  const puntosGanador = tienePuntos ? (ganoA ? partido.puntosA! : partido.puntosB!) : null;
  const puntosPerdedor = tienePuntos ? (ganoA ? partido.puntosB! : partido.puntosA!) : null;

  return {
    detalle: (tienePuntos ? "puntos" : "simple") as NivelDetalle,
    ganadorId: partido.ganador,
    perdedorId,
    puntosGanador,
    puntosPerdedor,
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
    puntosGanados: 0,
    puntosPerdidos: 0,
    partidosConPuntos: 0,
    racha: { tipo: null, largo: 0 },
    mejorRacha: 0,
    peorRacha: 0,
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

    const diferencia =
      base.puntosGanador !== null && base.puntosPerdedor !== null
        ? base.puntosGanador - base.puntosPerdedor
        : null;

    const cambio = variacionElo({
      eloGanador: ganaA ? a.elo : b.elo,
      eloPerdedor: ganaA ? b.elo : a.elo,
      partidosGanador: ganaA ? a.pj : b.pj,
      partidosPerdedor: ganaA ? b.pj : a.pj,
      diferenciaPuntos: diferencia,
    });

    const deltaA = ganaA ? cambio.ganador : cambio.perdedor;
    const deltaB = ganaA ? cambio.perdedor : cambio.ganador;

    resultados.push({
      partido,
      ...base,
      eloAntes: { a: a.elo, b: b.elo },
      eloDespues: { a: a.elo + deltaA, b: b.elo + deltaB },
      delta: { a: deltaA, b: deltaB },
    });

    aplicar(a, {
      delta: deltaA,
      gano: ganaA,
      rival: b.jugador.id,
      puntosPropios: ganaA ? base.puntosGanador : base.puntosPerdedor,
      puntosRival: ganaA ? base.puntosPerdedor : base.puntosGanador,
      partidoId: partido.id,
      fecha: partido.jugadoEn,
    });

    aplicar(b, {
      delta: deltaB,
      gano: !ganaA,
      rival: a.jugador.id,
      puntosPropios: ganaA ? base.puntosPerdedor : base.puntosGanador,
      puntosRival: ganaA ? base.puntosGanador : base.puntosPerdedor,
      partidoId: partido.id,
      fecha: partido.jugadoEn,
    });
  }

  for (const stat of Object.values(stats)) {
    stat.efectividad = stat.pj > 0 ? stat.pg / stat.pj : 0;
    stat.forma = stat.historia
      .slice(-6)
      .reverse()
      .map((punto) => (punto.gano ? "G" : "P"));
    stat.ultimoPartido = stat.historia.at(-1)?.fecha ?? null;

    let largo = 0;
    let tipo: "G" | "P" | null = null;
    for (let i = stat.historia.length - 1; i >= 0; i -= 1) {
      const marca = stat.historia[i].gano ? "G" : "P";
      if (tipo === null) tipo = marca;
      if (marca !== tipo) break;
      largo += 1;
    }
    stat.racha = { tipo, largo };

    let ganadas = 0;
    let perdidas = 0;
    for (const punto of stat.historia) {
      ganadas = punto.gano ? ganadas + 1 : 0;
      perdidas = punto.gano ? 0 : perdidas + 1;
      if (ganadas > stat.mejorRacha) stat.mejorRacha = ganadas;
      if (perdidas > stat.peorRacha) stat.peorRacha = perdidas;
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
    puntosPropios: number | null;
    puntosRival: number | null;
    partidoId: string;
    fecha: string;
  },
) {
  stat.elo += datos.delta;
  stat.pico = Math.max(stat.pico, stat.elo);
  stat.pj += 1;
  if (datos.gano) stat.pg += 1;
  else stat.pp += 1;

  if (datos.puntosPropios !== null && datos.puntosRival !== null) {
    stat.puntosGanados += datos.puntosPropios;
    stat.puntosPerdidos += datos.puntosRival;
    stat.partidosConPuntos += 1;
  }

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
    rival: datos.rival,
  });
}

/** ELO, después partidos ganados, después efectividad, después alfabético. */
function ordenar(lista: StatsJugador[]): StatsJugador[] {
  return [...lista].sort((x, y) => {
    if (y.elo !== x.elo) return y.elo - x.elo;
    if (y.pg !== x.pg) return y.pg - x.pg;
    if (y.efectividad !== x.efectividad) return y.efectividad - x.efectividad;
    return x.jugador.nombre.localeCompare(y.jugador.nombre, "es");
  });
}

export function computarLiga(estado: Estado): Liga {
  const { stats, resultados } = simular(estado.jugadores, estado.partidos);

  const conPartidos = Object.values(stats).filter((stat) => stat.pj > 0);
  const ordenados = ordenar(conPartidos);

  // El puesto de antes del último partido cargado: así la flecha de subida o
  // bajada dice algo concreto ("esto te movió el último partido").
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
    return { ...stat, puesto, deltaPuesto: previo === undefined ? 0 : previo - puesto };
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
    totalConPuntos: resultados.filter((resultado) => resultado.detalle === "puntos").length,
  };
}

/** Cruces de un jugador contra todos sus rivales, del más jugado al menos. */
export function crucesDe(liga: Liga, jugadorId: string): Cruce[] {
  const stats = liga.stats[jugadorId];
  if (!stats) return [];

  return Object.entries(stats.h2h)
    .map(([rivalId, marca]) => ({
      rival: liga.porId[rivalId],
      pg: marca.pg,
      pp: marca.pp,
      total: marca.pg + marca.pp,
    }))
    .filter((cruce): cruce is Cruce => Boolean(cruce.rival))
    .sort((x, y) => y.total - x.total || y.pg - x.pg);
}

/** Todos los partidos entre dos jugadores, del más nuevo al más viejo. */
export function historialCruce(liga: Liga, unoId: string, otroId: string): ResultadoPartido[] {
  return liga.recientes.filter(
    (resultado) =>
      (resultado.partido.jugadorA === unoId && resultado.partido.jugadorB === otroId) ||
      (resultado.partido.jugadorA === otroId && resultado.partido.jugadorB === unoId),
  );
}
