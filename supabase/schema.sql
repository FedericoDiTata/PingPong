-- ===========================================================================
-- Ping Pong · la liga — esquema de la base
--
-- Pegar tal cual en Supabase → SQL Editor → New query → Run.
-- Se puede correr más de una vez sin romper nada.
-- ===========================================================================

-- --------------------------------------------------------------- jugadores --
-- Las fotos no están acá a propósito: viven en `public/jugadores/` y viajan con
-- la app, así que están en todos los teléfonos sin pasar por la base.
create table if not exists public.jugadores (
  id text primary key,
  nombre text not null,
  emoji text not null default '🏓',
  creado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------- partidos --
-- Un game a 11. Lo único obligatorio es quién ganó: el marcador exacto casi
-- nunca se recuerda, y exigirlo dejaría la liga vacía.
create table if not exists public.partidos (
  id text primary key,
  jugador_a text not null references public.jugadores (id) on delete cascade,
  jugador_b text not null references public.jugadores (id) on delete cascade,
  ganador text not null references public.jugadores (id) on delete cascade,
  puntos_a smallint,
  puntos_b smallint,
  jugado_en timestamptz not null default now(),

  -- El ganador tiene que ser uno de los dos que jugaron.
  constraint ganador_valido check (ganador = jugador_a or ganador = jugador_b),
  -- Nadie juega contra sí mismo.
  constraint rivales_distintos check (jugador_a <> jugador_b),
  -- O están los dos marcadores o no está ninguno.
  constraint marcador_completo check ((puntos_a is null) = (puntos_b is null))
);

create index if not exists partidos_jugado_en_idx on public.partidos (jugado_en);

-- ------------------------------------------------------------- movimientos --
-- Quién anotó qué y cuándo. Es un registro, no una tabla de trabajo: se escribe
-- y se lee, nunca se corrige.
--
-- No hay claves foráneas a propósito. Un partido borrado deja de existir en
-- `partidos`, y es justo el caso donde más importa que quede la línea; si la
-- base lo arrastrara en cascada, borrar taparía exactamente lo que se quiere
-- ver. Por eso también se guardan el nombre y las fotos completas del antes y
-- el después: el registro tiene que entenderse solo dentro de un año.
create table if not exists public.movimientos (
  id text primary key,
  entidad text not null check (entidad in ('partido', 'jugador')),
  tipo text not null check (tipo in ('alta', 'edicion', 'baja')),
  sobre text not null,
  quien_id text,
  quien_nombre text not null,
  antes jsonb,
  despues jsonb,
  cuando timestamptz not null default now()
);

create index if not exists movimientos_sobre_idx on public.movimientos (sobre);
create index if not exists movimientos_cuando_idx on public.movimientos (cuando desc);

-- ---------------------------------------------------------------- permisos --
-- No hay cuentas: la liga es de quien tenga el link de la app. La clave
-- pública viaja en el navegador, así que cualquiera que la vea puede escribir.
-- Para una liga de ping pong entre amigos alcanza; no metas nada privado acá.
alter table public.jugadores enable row level security;
alter table public.partidos enable row level security;

drop policy if exists "liga abierta jugadores" on public.jugadores;
create policy "liga abierta jugadores" on public.jugadores
  for all using (true) with check (true);

drop policy if exists "liga abierta partidos" on public.partidos;
create policy "liga abierta partidos" on public.partidos
  for all using (true) with check (true);

-- El registro es la excepción: todos pueden leerlo y sumarle líneas, nadie
-- puede cambiarlas ni borrarlas. Un registro que se puede editar no registra
-- nada. Al no existir política de update ni de delete, la base las rechaza.
alter table public.movimientos enable row level security;

drop policy if exists "registro visible" on public.movimientos;
create policy "registro visible" on public.movimientos
  for select using (true);

drop policy if exists "registro se suma" on public.movimientos;
create policy "registro se suma" on public.movimientos
  for insert with check (true);

-- ---------------------------------------------------------------- realtime --
-- Para que un resultado cargado en un celular aparezca solo en los demás.
do $$
begin
  alter publication supabase_realtime add table public.jugadores;
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.partidos;
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.movimientos;
exception
  when duplicate_object then null;
end
$$;
