"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { Avatar } from "@/components/Avatar";
import { CargaManual } from "@/components/CargaManual";
import { IconoJugadores, IconoRayo } from "@/components/Iconos";
import { Cargando, Encabezado, Pagina } from "@/components/Pagina";
import { PartidoVivo, type ConfigVivo } from "@/components/PartidoVivo";
import { SelectorDuelo } from "@/components/SelectorDuelo";
import { Boton, EstadoVacio, Segmentado } from "@/components/ui";
import { useLiga } from "@/lib/store";
import { otroLado, type Lado } from "@/lib/vivo";

export default function PaginaPartido() {
  const { liga, hidratado, agregarPartido, borrarPartido, cargarDemo } = useLiga();

  const [modo, setModo] = useState<"vivo" | "manual">("vivo");
  const [a, setA] = useState<string | null>(null);
  const [b, setB] = useState<string | null>(null);
  const [alMejorDe, setAlMejorDe] = useState(5);
  const [meta, setMeta] = useState<11 | 21>(11);
  const [saque, setSaque] = useState<Lado>("a");
  const [config, setConfig] = useState<ConfigVivo | null>(null);
  const [sorteando, setSorteando] = useState(false);

  if (!hidratado) {
    return (
      <Pagina>
        <Encabezado etiqueta="A la mesa" titulo="Nuevo partido" />
        <Cargando />
      </Pagina>
    );
  }

  if (liga.jugadores.length < 2) {
    return (
      <Pagina>
        <Encabezado etiqueta="A la mesa" titulo="Nuevo partido" />
        <EstadoVacio
          icono={<IconoJugadores className="size-8" />}
          titulo="Faltan jugadores"
          detalle="Para anotar un partido tiene que haber al menos dos personas cargadas en la liga."
          accion={
            <>
              <Link href="/jugadores">
                <Boton variante="primario" tamano="lg">
                  Agregar jugadores
                </Boton>
              </Link>
              {liga.jugadores.length === 0 ? (
                <Boton variante="fantasma" tamano="lg" onClick={cargarDemo}>
                  Ver con datos de ejemplo
                </Boton>
              ) : null}
            </>
          }
        />
      </Pagina>
    );
  }

  if (config) {
    return (
      <PartidoVivo
        liga={liga}
        config={config}
        onSalir={() => setConfig(null)}
        onGuardar={(games) =>
          agregarPartido({
            jugadorA: config.a,
            jugadorB: config.b,
            games,
            jugadoEn: new Date().toISOString(),
            origen: "vivo",
            meta: config.meta,
          }).id
        }
        onBorrar={borrarPartido}
        onRevancha={() =>
          setConfig((previo) => (previo ? { ...previo, saque: otroLado(previo.saque) } : previo))
        }
      />
    );
  }

  const jugadorA = a ? liga.porId[a] : null;
  const jugadorB = b ? liga.porId[b] : null;
  const listo = Boolean(a && b && a !== b);

  function sortearSaque() {
    setSorteando(true);
    let vueltas = 0;
    const intervalo = window.setInterval(() => {
      setSaque((previo) => otroLado(previo));
      vueltas += 1;
      if (vueltas > 8) {
        window.clearInterval(intervalo);
        setSorteando(false);
      }
    }, 90);
  }

  return (
    <Pagina>
      <Encabezado
        etiqueta="A la mesa"
        titulo="Nuevo partido"
        bajada="Llevá el marcador punto por punto o cargá un resultado que ya jugaste."
      />

      <Segmentado
        idGrupo="modo-partido"
        valor={modo}
        onCambio={setModo}
        className="mb-8 w-full max-w-sm"
        opciones={[
          { valor: "vivo", texto: "En vivo", icono: <IconoRayo className="size-3.5" /> },
          { valor: "manual", texto: "Cargar resultado" },
        ]}
      />

      {modo === "manual" ? (
        <CargaManual liga={liga} onGuardar={(partido) => agregarPartido(partido).id} />
      ) : (
        <div className="flex flex-col gap-8">
          <SelectorDuelo
            liga={liga}
            a={a}
            b={b}
            onCambio={(nuevoA, nuevoB) => {
              setA(nuevoA);
              setB(nuevoB);
            }}
          />

          <div className="flex flex-wrap gap-x-10 gap-y-6">
            <div className="flex flex-col gap-2">
              <span className="etiqueta">Al mejor de</span>
              <Segmentado
                idGrupo="al-mejor-de"
                valor={String(alMejorDe)}
                onCambio={(valor) => setAlMejorDe(Number(valor))}
                opciones={[
                  { valor: "3", texto: "3" },
                  { valor: "5", texto: "5" },
                  { valor: "7", texto: "7" },
                ]}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="etiqueta">Games a</span>
              <Segmentado
                idGrupo="meta-vivo"
                valor={String(meta)}
                onCambio={(valor) => setMeta(Number(valor) as 11 | 21)}
                opciones={[
                  { valor: "11", texto: "11" },
                  { valor: "21", texto: "21" },
                ]}
              />
            </div>

            {jugadorA && jugadorB ? (
              <div className="flex flex-col gap-2">
                <span className="etiqueta">Saca primero</span>
                <div className="flex items-center gap-2">
                  {(["a", "b"] as const).map((lado) => {
                    const jugador = lado === "a" ? jugadorA : jugadorB;
                    const activo = saque === lado;
                    return (
                      <button
                        key={lado}
                        onClick={() => setSaque(lado)}
                        className={`flex items-center gap-2 rounded-md border py-1.5 pl-1.5 pr-3.5 text-sm transition-colors duration-150 ${
                          activo
                            ? "border-pelota/50 bg-pelota/10 text-tiza"
                            : "border-[var(--borde)] bg-mesa-900 text-tiza-45 hover:text-tiza-70"
                        }`}
                      >
                        <Avatar jugador={jugador} tamano="xs" />
                        {jugador.nombre}
                      </button>
                    );
                  })}
                  <Boton
                    tamano="sm"
                    variante="fantasma"
                    onClick={sortearSaque}
                    disabled={sorteando}
                  >
                    <motion.span
                      animate={sorteando ? { rotate: 360 } : { rotate: 0 }}
                      transition={{ duration: 0.5, repeat: sorteando ? Infinity : 0, ease: "linear" }}
                      className="inline-block size-2 rounded-full bg-pelota"
                    />
                    Sortear
                  </Boton>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <Boton
              variante="primario"
              tamano="lg"
              disabled={!listo}
              onClick={() => {
                if (!a || !b) return;
                setConfig({ a, b, meta, alMejorDe, saque });
              }}
            >
              Empezar partido
            </Boton>
            <p className="text-center text-2xs text-tiza-25">
              Tocá cada mitad de la pantalla para sumar puntos. El saque, los deuces y el fin de
              cada game los lleva la app.
            </p>
          </div>
        </div>
      )}
    </Pagina>
  );
}
