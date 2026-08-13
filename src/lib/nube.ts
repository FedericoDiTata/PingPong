import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  EntidadMovimiento,
  Estado,
  Jugador,
  Movimiento,
  Partido,
  TipoMovimiento,
} from "./types";

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

/**
 * El panel de Supabase muestra dos direcciones parecidas: el "Project URL"
 * (https://xxx.supabase.co) y el endpoint REST, que termina en /rest/v1/. La
 * librería arma sola /auth/v1, /rest/v1 y /realtime/v1, así que si le llega la
 * segunda queda .../rest/v1/rest/v1 y la base contesta PGRST125. Copiar la que
 * no era es facilísimo, así que la recortamos en vez de fallar.
 */
function raiz(url: string): string {
  return url
    .trim()
    .replace(/\/(rest|auth|storage|realtime|functions)\/v\d+\/*$/, "")
    .replace(/\/+$/, "");
}

const CRUDA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const URL_BASE = CRUDA ? raiz(CRUDA) : undefined;

// Supabase renombró la clave pública: antes "anon", ahora "publishable". Las
// dos sirven y las dos son públicas; aceptamos cualquiera de las dos.
const CLAVE =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hayNube = Boolean(URL_BASE && CLAVE);

let cliente: SupabaseClient | null = null;

function conectar(): SupabaseClient {
  if (!URL_BASE || !CLAVE) throw new Error("Falta configurar Supabase");
  // Sin sesiones: la liga no tiene usuarios, y guardar tokens que nadie usa
  // sólo agrega cosas raras en el navegador.
  cliente ??= createClient(URL_BASE, CLAVE, {
    auth: { persistSession: false },
  });
  return cliente;
}

/* ----------------------------------------------------------- traducción --- */

// Las fotos no están acá: viven en `public/jugadores/` y se despliegan con la
// app (ver `fotos.ts`). La base sólo guarda lo que cambia jugando.
type FilaJugador = {
  id: string;
  nombre: string;
  emoji: string | null;
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
  creadoEn: fila.creado_en,
});

const aFilaJugador = (jugador: Jugador) => ({
  id: jugador.id,
  nombre: jugador.nombre,
  emoji: jugador.emoji,
  creado_en: jugador.creadoEn,
});

type FilaMovimiento = {
  id: string;
  entidad: EntidadMovimiento;
  tipo: TipoMovimiento;
  sobre: string;
  quien_id: string | null;
  quien_nombre: string;
  antes: Partido | Jugador | null;
  despues: Partido | Jugador | null;
  cuando: string;
};

const aMovimiento = (fila: FilaMovimiento): Movimiento => ({
  id: fila.id,
  entidad: fila.entidad,
  tipo: fila.tipo,
  sobre: fila.sobre,
  quienId: fila.quien_id,
  quienNombre: fila.quien_nombre,
  ...(fila.antes ? { antes: fila.antes } : {}),
  ...(fila.despues ? { despues: fila.despues } : {}),
  cuando: fila.cuando,
});

const aFilaMovimiento = (movimiento: Movimiento) => ({
  id: movimiento.id,
  entidad: movimiento.entidad,
  tipo: movimiento.tipo,
  sobre: movimiento.sobre,
  quien_id: movimiento.quienId,
  quien_nombre: movimiento.quienNombre,
  antes: movimiento.antes ?? null,
  despues: movimiento.despues ?? null,
  cuando: movimiento.cuando,
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

  const [jugadores, partidos, movimientos] = await Promise.all([
    db.from("jugadores").select("*").order("creado_en"),
    db.from("partidos").select("*").order("jugado_en"),
    db.from("movimientos").select("*").order("cuando", { ascending: false }),
  ]);

  if (jugadores.error) throw jugadores.error;
  if (partidos.error) throw partidos.error;

  // El registro no es motivo para tirar abajo la liga entera. Si la tabla
  // todavía no existe —código desplegado antes de correr el SQL— la app tiene
  // que seguir mostrando los partidos igual, sin registro.
  if (movimientos.error) console.error("No se pudo leer el registro", movimientos.error);

  return {
    version: 2,
    jugadores: (jugadores.data as FilaJugador[]).map(aJugador),
    partidos: (partidos.data as FilaPartido[]).map(aPartido),
    movimientos: movimientos.error ? [] : (movimientos.data as FilaMovimiento[]).map(aMovimiento),
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

/** Suma una línea al registro. La base no deja tocarla después. */
export async function anotarMovimiento(movimiento: Movimiento): Promise<void> {
  const { error } = await conectar().from("movimientos").insert(aFilaMovimiento(movimiento));
  if (error) throw error;
}

/**
 * Deja la base exactamente como el estado que se le pasa. Para importar y vaciar.
 *
 * No toca el registro de movimientos, y no podría aunque quisiera: la base no
 * deja borrar de ahí. Vaciar la liga es en sí mismo algo que conviene que quede
 * anotado.
 */
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
 * Agrega lo que falte, sin tocar lo que ya está. Los jugadores van primero
 * porque los partidos los referencian.
 *
 * Todo se identifica por id, así que sumar dos veces lo mismo no duplica nada:
 * es lo que permite que dos personas hagan esto a la vez sin pisarse.
 */
export async function sumarALaLiga(estado: Estado): Promise<void> {
  const db = conectar();

  if (estado.jugadores.length > 0) {
    const { error } = await db.from("jugadores").upsert(estado.jugadores.map(aFilaJugador), {
      onConflict: "id",
      ignoreDuplicates: true,
    });
    if (error) throw error;
  }

  if (estado.partidos.length > 0) {
    const { error } = await db.from("partidos").upsert(estado.partidos.map(aFilaPartido), {
      onConflict: "id",
      ignoreDuplicates: true,
    });
    if (error) throw error;
  }

  if (estado.movimientos.length > 0) {
    const { error } = await db.from("movimientos").upsert(estado.movimientos.map(aFilaMovimiento), {
      onConflict: "id",
      ignoreDuplicates: true,
    });
    if (error) throw error;
  }
}

/**
 * Carga el estado sólo si la base está vacía. Los ids son fijos, así que si dos
 * personas abren la app al mismo tiempo la segunda no duplica nada.
 */
export async function sembrarSiEstaVacia(estado: Estado): Promise<boolean> {
  const { count, error } = await conectar()
    .from("jugadores")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  if ((count ?? 0) > 0) return false;

  await sumarALaLiga(estado);
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
