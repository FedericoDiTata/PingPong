"use client";

import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { IconoMas } from "@/components/Iconos";
import { Cargando, Encabezado, Pagina } from "@/components/Pagina";
import { Podio, TablaPosiciones } from "@/components/Ranking";
import { TarjetaPartido } from "@/components/TarjetaPartido";
import { Boton, Cinta, EstadoVacio, TituloSeccion } from "@/components/ui";
import { useLiga } from "@/lib/store";

export default function PaginaRanking() {
  const { liga, hidratado } = useLiga();

  if (!hidratado) {
    return (
      <Pagina>
        <Encabezado rotulo="La liga" titulo="Ranking" />
        <Cargando />
      </Pagina>
    );
  }

  if (liga.jugadores.length === 0) {
    return (
      <Pagina>
        <Encabezado
          rotulo="La liga"
          titulo="Ranking"
          bajada="Todavía no hay nadie anotado. Sumá a los que juegan y el ranking se arma solo."
        />
        <EstadoVacio
          titulo="La mesa está vacía"
          detalle="Cargá a los jugadores una sola vez. Después alcanza con anotar quién le ganó a quién."
          accion={
            <Link href="/jugadores">
              <Boton variante="naranja" tamano="lg">
                <IconoMas className="size-4" />
                Agregar jugadores
              </Boton>
            </Link>
          }
        />
      </Pagina>
    );
  }

  if (liga.totalPartidos === 0) {
    return (
      <Pagina>
        <Encabezado
          rotulo="La liga"
          titulo="Ranking"
          bajada={`${liga.jugadores.length} anotados y ningún partido jugado.`}
        />
        <EstadoVacio
          titulo="Sin partidos todavía"
          detalle="Todos arrancan en 1000 puntos. El primer resultado ya mueve la tabla."
          accion={
            <Link href="/cargar">
              <Boton variante="naranja" tamano="lg">
                Anotar el primero
              </Boton>
            </Link>
          }
        />
      </Pagina>
    );
  }

  const lider = liga.tabla[0];

  const titulares = liga.recientes.slice(0, 8).map((resultado) => {
    const ganador = liga.porId[resultado.ganadorId]?.nombre ?? "";
    const perdedor = liga.porId[resultado.perdedorId]?.nombre ?? "";
    return resultado.puntosGanador !== null
      ? `${ganador} ${resultado.puntosGanador}-${resultado.puntosPerdedor} ${perdedor}`
      : `${ganador} le ganó a ${perdedor}`;
  });

  return (
    <Pagina>
      <Encabezado
        rotulo="La liga"
        titulo="Ranking"
        bajada={`${liga.totalPartidos} partidos anotados entre ${liga.tabla.length} jugadores.`}
        accion={
          <Link href="/cargar" className="hidden md:block">
            <Boton variante="naranja" tamano="lg">
              <IconoMas className="size-5" />
              Cargar resultado
            </Boton>
          </Link>
        }
      />

      <Cinta items={titulares} className="mb-10 -rotate-1" />

      <Podio tabla={liga.tabla} />

      {lider && lider.racha.tipo === "G" && lider.racha.largo >= 2 ? (
        <p className="mb-8 text-center text-base font-bold text-crema/70">
          <span className="text-crema">{lider.jugador.nombre}</span> manda la mesa con{" "}
          <span className="display text-naranja">{lider.racha.largo}</span> victorias al hilo.
        </p>
      ) : null}

      <section className="mb-14">
        <TablaPosiciones tabla={liga.tabla} />
      </section>

      {liga.sinJugar.length > 0 ? (
        <section className="mb-14">
          <TituloSeccion rotulo="Todavía en la silla" titulo="Sin partidos" />
          <ul className="flex flex-wrap gap-2.5">
            {liga.sinJugar.map((stat) => (
              <li key={stat.jugador.id}>
                <Link
                  href={`/jugador/${stat.jugador.id}`}
                  className="cartel-azul flex items-center gap-2.5 rounded-md py-2 pl-2 pr-4"
                >
                  <Avatar jugador={stat.jugador} tamano="xs" torcido={false} />
                  <span className="display text-lg text-crema">{stat.jugador.nombre}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <TituloSeccion
          rotulo="Lo último"
          titulo="Últimos partidos"
          accion={
            <Link
              href="/historial"
              className="text-2xs font-bold uppercase tracking-[0.12em] text-naranja hover:text-naranja-claro"
            >
              Ver todo →
            </Link>
          }
        />
        <div className="flex flex-col gap-2.5">
          {liga.recientes.slice(0, 5).map((resultado, indice) => (
            <TarjetaPartido
              key={resultado.partido.id}
              resultado={resultado}
              liga={liga}
              indice={indice}
            />
          ))}
        </div>
      </section>
    </Pagina>
  );
}
