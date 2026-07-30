"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Avatar } from "@/components/Avatar";
import { IconoHistorial } from "@/components/Iconos";
import { Cargando, Encabezado, Pagina } from "@/components/Pagina";
import { TarjetaPartido } from "@/components/TarjetaPartido";
import { Boton, EstadoVacio } from "@/components/ui";
import { etiquetaDia } from "@/lib/format";
import type { ResultadoPartido } from "@/lib/liga";
import { useLiga } from "@/lib/store";

export default function PaginaHistorial() {
  const { liga, hidratado, borrarPartido } = useLiga();
  const [filtro, setFiltro] = useState<string | null>(null);

  const grupos = useMemo(() => {
    const visibles = filtro
      ? liga.recientes.filter(
          (resultado) =>
            resultado.partido.jugadorA === filtro || resultado.partido.jugadorB === filtro,
        )
      : liga.recientes;

    const mapa = new Map<string, ResultadoPartido[]>();
    for (const resultado of visibles) {
      const clave = etiquetaDia(resultado.partido.jugadoEn);
      const lista = mapa.get(clave);
      if (lista) lista.push(resultado);
      else mapa.set(clave, [resultado]);
    }
    return [...mapa.entries()];
  }, [liga.recientes, filtro]);

  if (!hidratado) {
    return (
      <Pagina>
        <Encabezado etiqueta="Todo lo jugado" titulo="Historial" />
        <Cargando />
      </Pagina>
    );
  }

  if (liga.totalPartidos === 0) {
    return (
      <Pagina>
        <Encabezado etiqueta="Todo lo jugado" titulo="Historial" />
        <EstadoVacio
          icono={<IconoHistorial className="size-8" />}
          titulo="Todavía no hay partidos"
          detalle="Cada partido que anotes queda acá, con el detalle game por game y lo que movió el puntaje."
          accion={
            <Link href="/partido">
              <Boton variante="primario" tamano="lg">
                Anotar un partido
              </Boton>
            </Link>
          }
        />
      </Pagina>
    );
  }

  return (
    <Pagina>
      <Encabezado
        etiqueta="Todo lo jugado"
        titulo="Historial"
        bajada={`${liga.totalPartidos} partidos anotados desde el primer día.`}
      />

      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setFiltro(null)}
          className={`rounded-md border px-3.5 py-2 text-sm transition-colors duration-150 ${
            filtro === null
              ? "border-pelota/45 bg-pelota/10 text-tiza"
              : "border-[var(--borde)] bg-mesa-900 text-tiza-45 hover:text-tiza-70"
          }`}
        >
          Todos
        </button>
        {liga.tabla.map((fila) => {
          const activo = filtro === fila.jugador.id;
          return (
            <button
              key={fila.jugador.id}
              onClick={() => setFiltro(activo ? null : fila.jugador.id)}
              className={`flex items-center gap-2 rounded-md border py-1.5 pl-1.5 pr-3.5 text-sm transition-colors duration-150 ${
                activo
                  ? "border-pelota/45 bg-pelota/10 text-tiza"
                  : "border-[var(--borde)] bg-mesa-900 text-tiza-45 hover:text-tiza-70"
              }`}
            >
              <Avatar jugador={fila.jugador} tamano="xs" />
              {fila.jugador.nombre}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-8">
        {grupos.map(([dia, partidos]) => (
          <section key={dia}>
            <h2 className="sticky top-14 z-10 -mx-4 mb-3 bg-mesa-950/85 px-4 py-2 backdrop-blur-sm md:top-16 md:-mx-8 md:px-8">
              <span className="etiqueta">{dia}</span>
            </h2>
            <div className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {partidos.map((resultado, indice) => (
                  <TarjetaPartido
                    key={resultado.partido.id}
                    resultado={resultado}
                    liga={liga}
                    indice={indice}
                    onBorrar={() => borrarPartido(resultado.partido.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </section>
        ))}

        {grupos.length === 0 ? (
          <p className="py-10 text-center text-sm text-tiza-45">
            No hay partidos de ese jugador todavía.
          </p>
        ) : null}
      </div>
    </Pagina>
  );
}
