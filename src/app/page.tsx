"use client";

import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { IconoMas } from "@/components/Iconos";
import { ManoAMano } from "@/components/ManoAMano";
import { Cargando, Encabezado, Pagina } from "@/components/Pagina";
import { Podio, TablaPosiciones } from "@/components/Ranking";
import { Boton, EstadoVacio, TituloSeccion } from "@/components/ui";
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
          detalle="Todos arrancan con 50 puntos. El primer resultado ya mueve la tabla."
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

  // El podio muestra cuatro: si hay más jugadores, del quinto para abajo
  // seguimos necesitando la tabla.
  const resto = liga.tabla.slice(4);

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

      <Podio tabla={liga.tabla} />

      {resto.length > 0 ? (
        <section className="mb-14">
          <TituloSeccion rotulo="La tabla" titulo="Del quinto para abajo" />
          <TablaPosiciones tabla={resto} />
        </section>
      ) : null}

      <section className="mb-14">
        <TituloSeccion rotulo="Cara a cara" titulo="Mano a mano" />
        <ManoAMano liga={liga} />
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
    </Pagina>
  );
}
