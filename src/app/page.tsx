"use client";

import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { IconoMas, IconoPodio } from "@/components/Iconos";
import { Cargando, Encabezado, Pagina } from "@/components/Pagina";
import { Podio, TablaPosiciones } from "@/components/Ranking";
import { TarjetaPartido } from "@/components/TarjetaPartido";
import { Boton, EstadoVacio, TituloSeccion } from "@/components/ui";
import { useLiga } from "@/lib/store";

export default function PaginaRanking() {
  const { liga, hidratado, cargarDemo } = useLiga();

  if (!hidratado) {
    return (
      <Pagina>
        <Encabezado etiqueta="La liga" titulo="Ranking" />
        <Cargando />
      </Pagina>
    );
  }

  if (liga.jugadores.length === 0) {
    return (
      <Pagina>
        <Encabezado
          etiqueta="La liga"
          titulo="Ranking"
          bajada="Todavía no hay nadie anotado. Sumá a los que juegan y el ranking se arma solo con los resultados."
        />
        <EstadoVacio
          icono={<IconoPodio className="size-8" />}
          titulo="La mesa está vacía"
          detalle="Cargá los jugadores una sola vez. Después, cada partido que anotes actualiza puestos, rachas y puntaje."
          accion={
            <>
              <Link href="/jugadores">
                <Boton variante="primario" tamano="lg">
                  <IconoMas className="size-4" />
                  Agregar jugadores
                </Boton>
              </Link>
              <Boton variante="fantasma" tamano="lg" onClick={cargarDemo}>
                Ver con datos de ejemplo
              </Boton>
            </>
          }
        />
      </Pagina>
    );
  }

  if (liga.totalPartidos === 0) {
    return (
      <Pagina>
        <Encabezado
          etiqueta="La liga"
          titulo="Ranking"
          bajada={`${liga.jugadores.length} anotados y ningún partido jugado. El ranking arranca en el primero.`}
        />
        <EstadoVacio
          icono={<IconoPodio className="size-8" />}
          titulo="Sin partidos todavía"
          detalle="Todos arrancan en 1000 puntos. El primer resultado ya mueve la tabla."
          accion={
            <Link href="/partido">
              <Boton variante="primario" tamano="lg">
                Anotar el primero
              </Boton>
            </Link>
          }
        />
      </Pagina>
    );
  }

  const lider = liga.tabla[0];

  return (
    <Pagina>
      <Encabezado
        etiqueta="La liga"
        titulo="Ranking"
        bajada={`${liga.totalPartidos} partidos jugados · ${liga.totalPuntos.toLocaleString("es-AR")} puntos disputados`}
        accion={
          <Link href="/partido" className="hidden md:block">
            <Boton variante="primario">
              <IconoMas className="size-4" />
              Nuevo partido
            </Boton>
          </Link>
        }
      />

      <Podio tabla={liga.tabla} />

      {lider && lider.racha.tipo === "G" && lider.racha.largo >= 2 ? (
        <p className="mb-8 text-center text-sm text-tiza-45">
          <span className="font-medium text-tiza">{lider.jugador.nombre}</span> manda la mesa con{" "}
          <span className="font-mono text-pelota">{lider.racha.largo}</span> victorias al hilo.
        </p>
      ) : null}

      <section className="mb-12">
        <TablaPosiciones tabla={liga.tabla} />
      </section>

      {liga.sinJugar.length > 0 ? (
        <section className="mb-12">
          <TituloSeccion etiqueta="Todavía en la silla" titulo="Sin partidos" />
          <ul className="flex flex-wrap gap-2">
            {liga.sinJugar.map((stat) => (
              <li key={stat.jugador.id}>
                <Link
                  href={`/jugador/${stat.jugador.id}`}
                  className="flex items-center gap-2.5 rounded-md border border-[var(--borde)] bg-mesa-900 py-2 pl-2 pr-4 text-sm text-tiza-70 transition-colors duration-150 hover:border-[var(--borde-fuerte)] hover:text-tiza"
                >
                  <Avatar jugador={stat.jugador} tamano="xs" />
                  {stat.jugador.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <TituloSeccion
          etiqueta="Lo último"
          titulo="Partidos recientes"
          accion={
            <Link
              href="/historial"
              className="text-sm text-tiza-45 transition-colors duration-150 hover:text-pelota"
            >
              Ver todo
            </Link>
          }
        />
        <div className="flex flex-col gap-2">
          {liga.recientes.slice(0, 4).map((resultado, indice) => (
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
