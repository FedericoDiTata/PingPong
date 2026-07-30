"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Avatar } from "@/components/Avatar";
import { Cargando, Encabezado, Pagina } from "@/components/Pagina";
import { TarjetaPartido } from "@/components/TarjetaPartido";
import { Boton, EstadoVacio } from "@/components/ui";
import { etiquetaDia } from "@/lib/format";
import type { ResultadoPartido } from "@/lib/liga";
import { escalonar, resorte } from "@/lib/motion";
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
        <Encabezado rotulo="Todo lo jugado" titulo="Historial" />
        <Cargando />
      </Pagina>
    );
  }

  if (liga.totalPartidos === 0) {
    return (
      <Pagina>
        <Encabezado rotulo="Todo lo jugado" titulo="Historial" />
        <EstadoVacio
          titulo="Todavía no hay partidos"
          detalle="Cada resultado que anotes queda acá, agrupado por día y con quién le ganó a quién."
          accion={
            <Link href="/cargar">
              <Boton variante="naranja" tamano="lg">
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
        rotulo="Todo lo jugado"
        titulo="Historial"
        bajada={`${liga.totalPartidos} partidos · ${liga.totalConPuntos} con marcador cargado.`}
      />

      <div className="mb-10 flex flex-wrap gap-2">
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => setFiltro(null)}
          className={`rounded-sm border-[3px] border-tinta px-3.5 py-2 text-2xs font-black uppercase tracking-[0.1em] transition-colors duration-100 ${
            filtro === null ? "bg-naranja text-tinta" : "bg-azul-800 text-crema/70 hover:text-crema"
          }`}
        >
          Todos
        </motion.button>

        {liga.tabla.map((fila, indice) => {
          const activo = filtro === fila.jugador.id;
          return (
            <motion.button
              key={fila.jugador.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...resorte, delay: escalonar(indice, 0.03) }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setFiltro(activo ? null : fila.jugador.id)}
              className={`flex items-center gap-2 rounded-sm border-[3px] border-tinta py-1.5 pl-1.5 pr-3 transition-colors duration-100 ${
                activo ? "bg-naranja text-tinta" : "bg-azul-800 text-crema/70 hover:text-crema"
              }`}
            >
              <Avatar jugador={fila.jugador} tamano="xs" torcido={false} />
              <span className="display text-base">{fila.jugador.nombre}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="flex flex-col gap-10">
        {grupos.map(([dia, partidos]) => (
          <section key={dia}>
            <h2 className="sticky top-16 z-10 -mx-4 mb-4 bg-azul-900/95 px-4 py-2 backdrop-blur-sm md:-mx-8 md:px-8">
              <span className="display text-xl text-naranja md:text-2xl">{dia}</span>
            </h2>
            <div className="flex flex-col gap-2.5">
              <AnimatePresence initial={false}>
                {partidos.map((resultado, indice) => (
                  <TarjetaPartido
                    key={resultado.partido.id}
                    resultado={resultado}
                    liga={liga}
                    indice={indice}
                    destacarA={filtro ?? undefined}
                    onBorrar={() => borrarPartido(resultado.partido.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </section>
        ))}

        {grupos.length === 0 ? (
          <p className="py-10 text-center text-base font-bold text-crema/50">
            No hay partidos de ese jugador todavía.
          </p>
        ) : null}
      </div>
    </Pagina>
  );
}
