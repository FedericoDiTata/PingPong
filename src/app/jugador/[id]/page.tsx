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
import { crucesDe } from "@/lib/liga";
import { escalonar, golpe, resorte } from "@/lib/motion";
import { useLiga } from "@/lib/store";

const PINTA = {
  gana: { fondo: "bg-naranja text-tinta", giro: -1.5 },
  pierde: { fondo: "bg-azul-700 text-crema", giro: 1.5 },
  total: { fondo: "bg-crema text-tinta", giro: -0.8 },
} as const;

function Marcador({
  numero,
  texto,
  variante,
  demora,
}: {
  numero: number;
  texto: string;
  variante: keyof typeof PINTA;
  demora: number;
}) {
  const pinta = PINTA[variante];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotate: pinta.giro * 5 }}
      animate={{ opacity: 1, scale: 1, rotate: pinta.giro }}
      transition={{ ...resorte, delay: demora }}
      className={`flex flex-1 flex-col items-center justify-center rounded-lg border-[3px] border-tinta px-3 py-6 shadow-[var(--golpe)] ${pinta.fondo}`}
    >
      <NumeroRodante valor={numero} className="display text-5xl leading-none" />
      <span className="rotulo mt-2 opacity-70">{texto}</span>
    </motion.div>
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
              <Boton variante="naranja">Ver jugadores</Boton>
            </Link>
          }
        />
      </Pagina>
    );
  }

  const fila = liga.tabla.find((candidata) => candidata.jugador.id === stats.jugador.id);
  const tono = tonoJugador(stats.jugador.id);
  const ultimoDelta = stats.historia.at(-1)?.delta ?? 0;
  const cruces = crucesDe(liga, stats.jugador.id);

  const partidos = liga.recientes
    .filter(
      (resultado) =>
        resultado.partido.jugadorA === stats.jugador.id ||
        resultado.partido.jugadorB === stats.jugador.id,
    )
    .slice(0, 6);

  // Víctima favorita: el rival al que más le gana, y le gana de verdad.
  // Bestia negra: el que más lo hace sufrir. Nunca pueden ser el mismo.
  const favorito = [...cruces]
    .filter((cruce) => cruce.pg > cruce.pp)
    .sort((x, y) => y.pg - x.pg || y.pg - y.pp - (x.pg - x.pp))[0];

  const bestiaNegra = [...cruces]
    .filter(
      (cruce) => cruce.pp >= cruce.pg && cruce.pp > 0 && cruce.rival.id !== favorito?.rival.id,
    )
    .sort((x, y) => y.pp - x.pp || y.pp - y.pg - (x.pp - x.pg))[0];

  return (
    <Pagina>
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-2xs font-black uppercase tracking-[0.14em] text-crema/60 transition-colors duration-100 hover:text-naranja"
      >
        <IconoVolver className="size-4" />
        Ranking
      </Link>

      {/* ------------------------------------------------------- ficha --- */}
      <header className="mb-10 flex flex-wrap items-end gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={resorte}
        >
          <Avatar jugador={stats.jugador} tamano="xl" />
        </motion.div>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {fila ? (
              <motion.span
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: -3 }}
                transition={{ ...golpe, delay: 0.1 }}
                className="display rounded-sm border-[3px] border-tinta px-2 py-0.5 text-lg text-tinta"
                style={{ backgroundColor: tono.fondo }}
              >
                #{fila.puesto}
              </motion.span>
            ) : null}
            {stats.racha.tipo === "G" && stats.racha.largo >= 3 ? (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...golpe, delay: 0.18 }}
                className="flex items-center gap-1 rounded-sm border-[3px] border-tinta bg-naranja px-2 py-1 text-2xs font-black uppercase text-tinta"
              >
                <IconoFuego className="size-3.5" />
                {stats.racha.largo} al hilo
              </motion.span>
            ) : null}
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...resorte, delay: 0.06 }}
            className="display text-4xl text-crema md:text-5xl"
          >
            {stats.jugador.nombre}
          </motion.h1>

          <div className="flex items-end gap-3">
            <NumeroRodante valor={stats.puntos} className="display text-3xl text-naranja" />
            <span className="rotulo pb-1.5 text-crema/50">puntos</span>
            {stats.pj > 0 ? (
              <span className="rotulo pb-1.5 text-crema/50">
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
            <Link href="/cargar">
              <Boton variante="naranja">Anotar un partido</Boton>
            </Link>
          }
        />
      ) : (
        <>
          {/* ------------------------------------------------ balance --- */}
          <section className="mb-14">
            <div className="mb-4 flex items-end justify-between gap-3">
              <h2 className="display text-2xl text-crema md:text-3xl">Ganados y perdidos</h2>
              <span className="rotulo text-crema/50">
                {porcentaje(stats.efectividad)} de efectividad
              </span>
            </div>

            <div className="flex gap-3">
              <Marcador numero={stats.pg} texto="ganados" variante="gana" demora={0.05} />
              <Marcador numero={stats.pp} texto="perdidos" variante="pierde" demora={0.12} />
              <Marcador numero={stats.pj} texto="jugados" variante="total" demora={0.19} />
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              {[
                { texto: "Mejor racha", valor: `${stats.mejorRacha}G` },
                { texto: "Peor racha", valor: `${stats.peorRacha}P` },
                { texto: "Pico histórico", valor: String(stats.pico) },
                ...(stats.partidosConPuntos > 0
                  ? [
                      {
                        texto: "Puntos a favor",
                        valor: `${stats.puntosGanados}–${stats.puntosPerdidos}`,
                      },
                    ]
                  : []),
              ].map((dato, indice) => (
                <motion.div
                  key={dato.texto}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...resorte, delay: 0.25 + escalonar(indice, 0.05) }}
                  className="cartel flex-1 rounded-md px-3 py-3"
                >
                  <p className="rotulo mb-1.5 text-tinta/50">{dato.texto}</p>
                  <p className="display text-2xl text-tinta">{dato.valor}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* -------------------------------------------- cara a cara --- */}
          {cruces.length > 0 ? (
            <section className="mb-14">
              <TituloSeccion rotulo="Cara a cara" titulo="Contra cada rival" />

              <ul className="flex flex-col gap-3">
                {cruces.map((cruce, indice) => {
                  const proporcion = cruce.total > 0 ? cruce.pg / cruce.total : 0;
                  const gana = cruce.pg > cruce.pp;
                  const empata = cruce.pg === cruce.pp;

                  return (
                    <motion.li
                      key={cruce.rival.id}
                      initial={{ opacity: 0, x: -26 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...resorte, delay: escalonar(indice, 0.05) }}
                      whileHover={{ y: -3, rotate: -0.4 }}
                      className="cartel rounded-md p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar jugador={cruce.rival} tamano="sm" />
                        <Link
                          href={`/jugador/${cruce.rival.id}`}
                          className="display min-w-0 flex-1 truncate text-xl text-tinta hover:text-naranja-hondo md:text-2xl"
                        >
                          {cruce.rival.nombre}
                        </Link>

                        <span className="display shrink-0 text-3xl text-tinta md:text-4xl">
                          <span className={gana ? "text-naranja-hondo" : ""}>{cruce.pg}</span>
                          <span className="text-tinta/25">–</span>
                          <span className={!gana && !empata ? "text-azul-700" : ""}>
                            {cruce.pp}
                          </span>
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-3 flex-1 overflow-hidden rounded-full border-2 border-tinta bg-azul-800">
                          <motion.span
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: proporcion }}
                            transition={{
                              type: "spring",
                              stiffness: 220,
                              damping: 22,
                              delay: 0.15 + escalonar(indice, 0.05),
                            }}
                            className="h-full w-full origin-left bg-naranja"
                          />
                        </div>
                        <span className="rotulo shrink-0 text-tinta/55">
                          {empata
                            ? "empatados"
                            : gana
                              ? `le gana ${porcentaje(proporcion)}`
                              : `pierde ${porcentaje(1 - proporcion)}`}
                        </span>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>

              {favorito || bestiaNegra ? (
                <p className="mt-5 text-sm font-bold leading-relaxed text-crema/65">
                  {favorito ? (
                    <>
                      Su víctima favorita es{" "}
                      <span className="text-naranja">{favorito.rival.nombre}</span> ({favorito.pg}-
                      {favorito.pp}).{" "}
                    </>
                  ) : null}
                  {bestiaNegra ? (
                    <>
                      Su bestia negra es{" "}
                      <span className="text-crema">{bestiaNegra.rival.nombre}</span> (
                      {bestiaNegra.pg}-{bestiaNegra.pp}).
                    </>
                  ) : null}
                </p>
              ) : null}
            </section>
          ) : null}

          {/* ---------------------------------------------- evolución --- */}
          <section className="mb-14">
            <TituloSeccion rotulo="Puntaje" titulo="Cómo viene" />
            <div className="cartel rounded-lg p-4 md:p-5">
              <div className="mb-4 flex items-end justify-between">
                <span className="rotulo text-tinta/50">Partido a partido</span>
                <span className="display text-lg text-tinta">pico {stats.pico}</span>
              </div>
              <Curva valores={stats.historia.map((punto) => punto.puntos)} color={tono.fuerte} />
            </div>
          </section>

          {/* ---------------------------------------------- partidos --- */}
          <section>
            <TituloSeccion
              rotulo="Lo último"
              titulo="Sus partidos"
              accion={
                <Link
                  href="/historial"
                  className="text-2xs font-bold uppercase tracking-[0.12em] text-naranja hover:text-naranja-claro"
                >
                  Ver historial →
                </Link>
              }
            />
            <div className="flex flex-col gap-2.5">
              {partidos.map((resultado, indice) => (
                <TarjetaPartido
                  key={resultado.partido.id}
                  resultado={resultado}
                  liga={liga}
                  indice={indice}
                  destacarA={stats.jugador.id}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </Pagina>
  );
}
