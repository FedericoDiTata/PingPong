"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { Avatar } from "@/components/Avatar";
import { Curva } from "@/components/Curva";
import { Forma } from "@/components/Forma";
import { IconoFuego, IconoVolver } from "@/components/Iconos";
import { NumeroRodante } from "@/components/NumeroRodante";
import { Cargando, Pagina } from "@/components/Pagina";
import { TarjetaPartido } from "@/components/TarjetaPartido";
import { Boton, EstadoVacio, TituloSeccion } from "@/components/ui";
import { tonoJugador } from "@/lib/color";
import { conSigno, porcentaje } from "@/lib/format";
import { useLiga } from "@/lib/store";

function Celda({ etiqueta, valor, detalle }: { etiqueta: string; valor: string; detalle?: string }) {
  return (
    <div className="bg-mesa-900 px-4 py-4">
      <p className="etiqueta mb-2">{etiqueta}</p>
      <p className="font-mono text-xl tabular-nums text-tiza">{valor}</p>
      {detalle ? <p className="mt-1 text-2xs text-tiza-25">{detalle}</p> : null}
    </div>
  );
}

export default function PaginaJugador() {
  const parametros = useParams<{ id: string }>();
  const { liga, hidratado } = useLiga();

  if (!hidratado) {
    return (
      <Pagina>
        <Cargando />
      </Pagina>
    );
  }

  const stats = liga.stats[parametros.id];

  if (!stats) {
    return (
      <Pagina>
        <EstadoVacio
          titulo="Ese jugador no existe"
          detalle="Puede que lo hayas borrado o que el enlace sea de otra liga."
          accion={
            <Link href="/jugadores">
              <Boton variante="primario">Ver jugadores</Boton>
            </Link>
          }
        />
      </Pagina>
    );
  }

  const fila = liga.tabla.find((candidata) => candidata.jugador.id === stats.jugador.id);
  const tono = tonoJugador(stats.jugador.id);
  const ultimoDelta = stats.historia.at(-1)?.delta ?? 0;

  const partidos = liga.recientes
    .filter(
      (resultado) =>
        resultado.partido.jugadorA === stats.jugador.id ||
        resultado.partido.jugadorB === stats.jugador.id,
    )
    .slice(0, 5);

  const cruces = Object.entries(stats.h2h)
    .map(([rivalId, marca]) => ({
      rival: liga.porId[rivalId],
      ...marca,
      total: marca.pg + marca.pp,
    }))
    .filter((cruce) => cruce.rival)
    .sort((x, y) => y.total - x.total);

  const nemesis = [...cruces].sort((x, y) => y.pp - x.pp || y.total - x.total)[0];
  const victima = [...cruces].sort((x, y) => y.pg - x.pg || y.total - x.total)[0];

  return (
    <Pagina>
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-tiza-45 transition-colors duration-150 hover:text-tiza"
      >
        <IconoVolver className="size-4" />
        Ranking
      </Link>

      <header className="mb-10 flex flex-wrap items-center gap-5">
        <div className="relative">
          <span
            aria-hidden
            className="absolute -inset-2 rounded-lg opacity-60 blur-xl"
            style={{ backgroundColor: tono.tenue }}
          />
          <Avatar jugador={stats.jugador} tamano="xl" className="relative" />
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-[-0.025em] text-tiza">
              {stats.jugador.nombre}
            </h1>
            {fila ? (
              <span
                className="rounded-xs px-2 py-1 font-mono text-2xs"
                style={{ backgroundColor: tono.tenue, color: tono.fuerte }}
              >
                #{fila.puesto} de {liga.tabla.length}
              </span>
            ) : null}
            {stats.racha.tipo === "G" && stats.racha.largo >= 3 ? (
              <span className="inline-flex items-center gap-1 rounded-xs bg-pelota/12 px-2 py-1 font-mono text-2xs text-pelota">
                <IconoFuego className="size-3" />
                {stats.racha.largo} al hilo
              </span>
            ) : null}
          </div>

          <div className="flex items-end gap-3">
            <NumeroRodante
              valor={stats.elo}
              className="font-mono text-4xl font-medium leading-none text-tiza"
            />
            {stats.pj > 0 ? (
              <span
                className={`pb-1 font-mono text-sm ${
                  ultimoDelta >= 0 ? "text-gana" : "text-pierde"
                }`}
              >
                {conSigno(ultimoDelta)} en el último
              </span>
            ) : null}
          </div>

          {stats.pj > 0 ? <Forma resultados={stats.forma} /> : null}
        </div>
      </header>

      {stats.pj === 0 ? (
        <EstadoVacio
          titulo="Todavía no jugó ningún partido"
          detalle="Arranca con 1000 puntos. En cuanto juegue el primero aparece en la tabla."
          accion={
            <Link href="/partido">
              <Boton variante="primario">Anotar un partido</Boton>
            </Link>
          }
        />
      ) : (
        <>
          <section className="mb-12">
            <div className="panel rounded-lg p-5">
              <div className="mb-4 flex items-end justify-between">
                <span className="etiqueta">Puntaje partido a partido</span>
                <span className="font-mono text-2xs text-tiza-25">pico {stats.pico}</span>
              </div>
              <Curva valores={stats.historia.map((punto) => punto.elo)} color={tono.fuerte} />
            </div>
          </section>

          <section className="mb-12">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--borde)] bg-[var(--borde)] md:grid-cols-4">
              <Celda etiqueta="Partidos" valor={String(stats.pj)} />
              <Celda
                etiqueta="Ganados"
                valor={String(stats.pg)}
                detalle={`${porcentaje(stats.efectividad)} de efectividad`}
              />
              <Celda etiqueta="Perdidos" valor={String(stats.pp)} />
              <Celda
                etiqueta="Sets"
                valor={`${stats.setsGanados}-${stats.setsPerdidos}`}
                detalle="ganados y perdidos"
              />
              <Celda
                etiqueta="Racha actual"
                valor={
                  stats.racha.tipo === "G"
                    ? `${stats.racha.largo}G`
                    : stats.racha.tipo === "P"
                      ? `${stats.racha.largo}P`
                      : "—"
                }
              />
              <Celda etiqueta="Mejor racha" valor={`${stats.mejorRacha}G`} />
              <Celda etiqueta="Pico histórico" valor={String(stats.pico)} />
              <Celda
                etiqueta="Diferencia"
                valor={conSigno(stats.difPuntos)}
                detalle={`${stats.puntosGanados} a favor · ${stats.puntosPerdidos} en contra`}
              />
            </div>
          </section>

          {cruces.length > 0 ? (
            <section className="mb-12">
              <TituloSeccion etiqueta="Cara a cara" titulo="Contra cada rival" />

              <ul className="flex flex-col gap-2">
                {cruces.map((cruce, indice) => {
                  const proporcion = cruce.total > 0 ? cruce.pg / cruce.total : 0;
                  return (
                    <li
                      key={cruce.rival.id}
                      className="panel flex items-center gap-4 rounded-md px-3.5 py-3"
                    >
                      <Avatar jugador={cruce.rival} tamano="xs" />
                      <Link
                        href={`/jugador/${cruce.rival.id}`}
                        className="w-24 shrink-0 truncate text-sm text-tiza transition-colors duration-150 hover:text-pelota"
                      >
                        {cruce.rival.nombre}
                      </Link>

                      <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-pierde/25">
                        <motion.span
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: proporcion }}
                          transition={{
                            duration: 0.6,
                            delay: 0.1 + indice * 0.04,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="h-full w-full origin-left bg-gana"
                        />
                      </div>

                      <span className="w-14 shrink-0 text-right font-mono text-sm tabular-nums">
                        <span className="text-gana">{cruce.pg}</span>
                        <span className="text-tiza-25">-</span>
                        <span className="text-pierde/80">{cruce.pp}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>

              {nemesis && victima && cruces.length > 1 ? (
                <p className="mt-4 text-sm leading-relaxed text-tiza-45">
                  {victima.pg > 0 ? (
                    <>
                      Le gana seguido a{" "}
                      <span className="text-tiza">{victima.rival.nombre}</span> ({victima.pg}-
                      {victima.pp}).{" "}
                    </>
                  ) : null}
                  {nemesis.pp > 0 ? (
                    <>
                      Su bestia negra es{" "}
                      <span className="text-tiza">{nemesis.rival.nombre}</span> ({nemesis.pg}-
                      {nemesis.pp}).
                    </>
                  ) : null}
                </p>
              ) : null}
            </section>
          ) : null}

          <section>
            <TituloSeccion
              etiqueta="Lo último"
              titulo="Sus partidos"
              accion={
                <Link
                  href="/historial"
                  className="text-sm text-tiza-45 transition-colors duration-150 hover:text-pelota"
                >
                  Ver historial
                </Link>
              }
            />
            <div className="flex flex-col gap-2">
              {partidos.map((resultado, indice) => (
                <TarjetaPartido
                  key={resultado.partido.id}
                  resultado={resultado}
                  liga={liga}
                  indice={indice}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </Pagina>
  );
}
