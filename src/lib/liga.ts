import { calcularNiveles, NIVEL_PROMEDIO, type Duelo } from "./nivel";
import type { DetalleMarcador, Estado, Jugador, Partido } from "./types";

export type ResultadoPartido = {
  partido: Partido;
  detalle: DetalleMarcador;
  ganadorId: string;
  perdedorId: string;
  /** Puntos del ganador y del perdedor dentro del game, si se cargaron. */
  puntosGanador: number | null;
  puntosPerdedor: number | null;
};

/**
 * El nivel al cierre de una fecha de juego.
 *
 * Va por día y no por partido a propósito: dentro de un mismo día los partidos
 * se cargan en cualquier orden, así que una marca por partido dibujaría una
 * curva distinta según cómo se acordaron de cargarlos. Por fecha siempre sale
 * el mismo dibujo.
 */
export type PuntoHistoria = {
  fecha: string;
  nivel: number;
};

export type Cruce = {
  rival: Jugador;
  pg: number;
  pp: number;
  total: number;
};

export type StatsJugador = {
  jugador: Jugador;
  /** De 0 a 100: la probabilidad de ganarle a un jugador promedio. */
  nivel: number;
  pico: number;
  pj: number;
  pg: number;
  pp: number;
  efectividad: number;
  puntosGanados: number;
  puntosPerdidos: number;
  partidosConPuntos: number;
  historia: PuntoHistoria[];
  h2h: Record<string, { pg: number; pp: number }>;
  ultimoPartido: string | null;
};

export type FilaTabla = StatsJugador & {
  puesto: number;
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

  const tienePuntos = typeof partido.puntosA === "number" && typeof partido.puntosB === "number";

  const puntosGanador = tienePuntos ? (ganoA ? partido.puntosA! : partido.puntosB!) : null;
  const puntosPerdedor = tienePuntos ? (ganoA ? partido.puntosB! : partido.puntosA!) : null;

  return {
    detalle: (tienePuntos ? "puntos" : "simple") as DetalleMarcador,
    ganadorId: partido.ganador,
    perdedorId,
    puntosGanador,
    puntosPerdedor,
  };
}

/**
 * Orden de carga, sólo para listar el historial. Ninguna estadística depende
 * de él: los partidos se anotan de memoria y en desorden, así que cualquier
 * número que mirara la secuencia sería inventado.
 */
function cronologico(partidos: Partido[]): Partido[] {
  return [...partidos].sort((x, y) => {
    if (x.jugadoEn === y.jugadoEn) return x.id < y.id ? -1 : 1;
    return x.jugadoEn < y.jugadoEn ? -1 : 1;
  });
}

const dueloDe = (partido: Partido): Duelo => ({
  ganador: partido.ganador,
  perdedor: partido.ganador === partido.jugadorA ? partido.jugadorB : partido.jugadorA,
});

function statsVacias(jugador: Jugador): StatsJugador {
  return {
    jugador,
    nivel: NIVEL_PROMEDIO,
    pico: NIVEL_PROMEDIO,
    pj: 0,
    pg: 0,
    pp: 0,
    efectividad: 0,
    puntosGanados: 0,
    puntosPerdidos: 0,
    partidosConPuntos: 0,
    historia: [],
    h2h: {},
    ultimoPartido: null,
  };
}

/** Nivel, después partidos ganados, después efectividad, después alfabético. */
function ordenar(lista: StatsJugador[]): StatsJugador[] {
  return [...lista].sort((x, y) => {
    if (y.nivel !== x.nivel) return y.nivel - x.nivel;
    if (y.pg !== x.pg) return y.pg - x.pg;
    if (y.efectividad !== x.efectividad) return y.efectividad - x.efectividad;
    return x.jugador.nombre.localeCompare(y.jugador.nombre, "es");
  });
}

export function computarLiga(estado: Estado): Liga {
  const ids = estado.jugadores.map((jugador) => jugador.id);
  const conocidos = new Set(ids);

  const stats: Record<string, StatsJugador> = {};
  for (const jugador of estado.jugadores) stats[jugador.id] = statsVacias(jugador);

  const validos = estado.partidos.filter(
    (partido) => conocidos.has(partido.jugadorA) && conocidos.has(partido.jugadorB),
  );

  /* --- Totales: no dependen del orden en que se hayan cargado --- */

  const resultados: ResultadoPartido[] = [];

  for (const partido of cronologico(validos)) {
    const base = resolver(partido);
    resultados.push({ partido, ...base });

    const ganador = stats[base.ganadorId];
    const perdedor = stats[base.perdedorId];

    ganador.pj += 1;
    ganador.pg += 1;
    perdedor.pj += 1;
    perdedor.pp += 1;

    const cruceGanador = ganador.h2h[base.perdedorId] ?? { pg: 0, pp: 0 };
    cruceGanador.pg += 1;
    ganador.h2h[base.perdedorId] = cruceGanador;

    const crucePerdedor = perdedor.h2h[base.ganadorId] ?? { pg: 0, pp: 0 };
    crucePerdedor.pp += 1;
    perdedor.h2h[base.ganadorId] = crucePerdedor;

    if (base.puntosGanador !== null && base.puntosPerdedor !== null) {
      ganador.puntosGanados += base.puntosGanador;
      ganador.puntosPerdidos += base.puntosPerdedor;
      ganador.partidosConPuntos += 1;
      perdedor.puntosGanados += base.puntosPerdedor;
      perdedor.puntosPerdidos += base.puntosGanador;
      perdedor.partidosConPuntos += 1;
    }
  }

  /* --- Nivel: una sola foto de todos los resultados juntos --- */

  const niveles = calcularNiveles(ids, validos.map(dueloDe));
  for (const id of ids) stats[id].nivel = niveles[id];

  for (const stat of Object.values(stats)) {
    stat.efectividad = stat.pj > 0 ? stat.pg / stat.pj : 0;
  }

  for (const resultado of resultados) {
    const fecha = resultado.partido.jugadoEn;
    for (const id of [resultado.partido.jugadorA, resultado.partido.jugadorB]) {
      const stat = stats[id];
      if (!stat.ultimoPartido || stat.ultimoPartido < fecha) stat.ultimoPartido = fecha;
    }
  }

  /* --- Cómo viene el nivel: una marca por fecha de juego --- */

  const dias = [...new Set(validos.map((partido) => partido.jugadoEn.slice(0, 10)))].sort();

  for (const dia of dias) {
    const hasta = validos.filter((partido) => partido.jugadoEn.slice(0, 10) <= dia);
    const nivelesDelDia = calcularNiveles(ids, hasta.map(dueloDe));
    const debutaron = new Set(hasta.flatMap((partido) => [partido.jugadorA, partido.jugadorB]));

    for (const id of ids) {
      // Antes de debutar no hay nada que dibujar: sería una línea plana falsa.
      if (!debutaron.has(id)) continue;
      stats[id].historia.push({ fecha: dia, nivel: nivelesDelDia[id] });
    }
  }

  for (const id of ids) {
    const stat = stats[id];
    stat.pico = stat.historia.reduce((mayor, punto) => Math.max(mayor, punto.nivel), stat.nivel);
  }

  /* --- Tabla --- */

  const tabla: FilaTabla[] = ordenar(Object.values(stats).filter((stat) => stat.pj > 0)).map(
    (stat, indice) => ({ ...stat, puesto: indice + 1 }),
  );

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
