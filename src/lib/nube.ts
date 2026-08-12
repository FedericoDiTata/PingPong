import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Estado, Jugador, Partido } from "./types";

/**
 * Acceso a la liga guardada en Supabase.
 *
 * Este archivo es el único que sabe cómo se llaman las columnas y cómo se
 * habla con la base. El resto de la app sigue viendo `Estado`, `Jugador` y
 * `Partido` de siempre.
 *
 * Si no hay variables de entorno configuradas, `hayNube` queda en false y la
 * app cae sola al guardado en el navegador: así sigue andando en una copia
 * recién clonada, sin cuenta de Supabase.
 */

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hayNube = Boolean(URL_BASE && CLAVE);

let cliente: SupabaseClient | null = null;

function conectar(): SupabaseClient {
  if (!URL_BASE || !CLAVE) throw new Error("Falta configurar Supabase");
  // Sin sesiones: la liga no tiene usuarios, y guardar tokens que nadie usa
  // sólo agrega cosas raras en el navegador.
  cliente ??= createClient(URL_BASE, CLAVE, { auth: { persistSession: false } });
  return cliente;
}

/* ----------------------------------------------------------- traducción --- */

type FilaJugador = {
  id: string;
  nombre: string;
  emoji: string | null;
  foto: string | null;
  creado_en: string;
};

type FilaPartido = {
  id: string;
  jugador_a: string;
  jugador_b: string;
  ganador: string;
  puntos_a: number | null;
  puntos_b: number | null;
  jugado_en: string;
};

const aJugador = (fila: FilaJugador): Jugador => ({
  id: fila.id,
  nombre: fila.nombre,
  emoji: fila.emoji ?? "🏓",
  ...(fila.foto ? { foto: fila.foto } : {}),
  creadoEn: fila.creado_en,
});

const aFilaJugador = (jugador: Jugador) => ({
  id: jugador.id,
  nombre: jugador.nombre,
  emoji: jugador.emoji,
  foto: jugador.foto ?? null,
  creado_en: jugador.creadoEn,
});

const aPartido = (fila: FilaPartido): Partido => ({
  id: fila.id,
  jugadorA: fila.jugador_a,
  jugadorB: fila.jugador_b,
  ganador: fila.ganador,
  ...(fila.puntos_a !== null && fila.puntos_b !== null
    ? { puntosA: fila.puntos_a, puntosB: fila.puntos_b }
    : {}),
  jugadoEn: fila.jugado_en,
});

const aFilaPartido = (partido: Partido) => ({
  id: partido.id,
  jugador_a: partido.jugadorA,
  jugador_b: partido.jugadorB,
  ganador: partido.ganador,
  puntos_a: partido.puntosA ?? null,
  puntos_b: partido.puntosB ?? null,
  jugado_en: partido.jugadoEn,
});

/* ------------------------------------------------------------- lectura --- */

export async function leerLiga(): Promise<Estado> {
  const db = conectar();

  const [jugadores, partidos] = await Promise.all([
    db.from("jugadores").select("*").order("creado_en"),
    db.from("partidos").select("*").order("jugado_en"),
  ]);

  if (jugadores.error) throw jugadores.error;
  if (partidos.error) throw partidos.error;

  return {
    version: 2,
    jugadores: (jugadores.data as FilaJugador[]).map(aJugador),
    partidos: (partidos.data as FilaPartido[]).map(aPartido),
  };
}

/* ------------------------------------------------------------ escritura --- */

export async function subirJugador(jugador: Jugador): Promise<void> {
  const { error } = await conectar().from("jugadores").upsert(aFilaJugador(jugador));
  if (error) throw error;
}

export async function bajarJugador(id: string): Promise<void> {
  // Los partidos se van solos: la tabla los borra en cascada.
  const { error } = await conectar().from("jugadores").delete().eq("id", id);
  if (error) throw error;
}

export async function subirPartido(partido: Partido): Promise<void> {
  const { error } = await conectar().from("partidos").upsert(aFilaPartido(partido));
  if (error) throw error;
}

export async function bajarPartido(id: string): Promise<void> {
  const { error } = await conectar().from("partidos").delete().eq("id", id);
  if (error) throw error;
}

/** Deja la base exactamente como el estado que se le pasa. Para importar y vaciar. */
export async function reemplazarTodo(estado: Estado): Promise<void> {
  const db = conectar();

  // Primero los partidos: dependen de los jugadores.
  const borrarPartidos = await db.from("partidos").delete().neq("id", "");
  if (borrarPartidos.error) throw borrarPartidos.error;

  const borrarJugadores = await db.from("jugadores").delete().neq("id", "");
  if (borrarJugadores.error) throw borrarJugadores.error;

  if (estado.jugadores.length > 0) {
    const { error } = await db.from("jugadores").insert(estado.jugadores.map(aFilaJugador));
    if (error) throw error;
  }

  if (estado.partidos.length > 0) {
    const { error } = await db.from("partidos").insert(estado.partidos.map(aFilaPartido));
    if (error) throw error;
  }
}

/**
 * Carga el estado sólo si la base está vacía. Los ids son fijos, así que si dos
 * personas abren la app al mismo tiempo la segunda no duplica nada.
 */
export async function sembrarSiEstaVacia(estado: Estado): Promise<boolean> {
  const db = conectar();

  const { count, error } = await db.from("jugadores").select("id", { count: "exact", head: true });
  if (error) throw error;
  if ((count ?? 0) > 0) return false;

  const conJugadores = await db
    .from("jugadores")
    .upsert(estado.jugadores.map(aFilaJugador), { onConflict: "id", ignoreDuplicates: true });
  if (conJugadores.error) throw conJugadores.error;

  const conPartidos = await db
    .from("partidos")
    .upsert(estado.partidos.map(aFilaPartido), { onConflict: "id", ignoreDuplicates: true });
  if (conPartidos.error) throw conPartidos.error;

  return true;
}

/* ------------------------------------------------------------ tiempo real --- */

/** Avisa cuando alguien más toca la liga desde otro teléfono. */
export function escucharCambios(alCambiar: () => void): () => void {
  const db = conectar();

  const canal = db
    .channel("liga")
    .on("postgres_changes", { event: "*", schema: "public", table: "jugadores" }, alCambiar)
    .on("postgres_changes", { event: "*", schema: "public", table: "partidos" }, alCambiar)
    .subscribe();

  return () => {
    void db.removeChannel(canal);
  };
}
