"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { golpe, resorte } from "@/lib/motion";
import { useLiga } from "@/lib/store";
import { Boton } from "./ui";

/**
 * Bienvenida de una sola vez por computadora.
 *
 * Existe porque el cambio a liga compartida es invisible y no da lo mismo: a
 * partir de acá lo que carga cualquiera aparece en el teléfono de todos, y lo
 * que este navegador tuviera guardado de antes puede quedar afuera para
 * siempre. Preferimos decirlo una vez, de frente, que dejar que se descubra
 * solo cuando falte un partido.
 */
export function PrimeraVez() {
  const { presentacion, entrarALaLiga, sumarYEntrar } = useLiga();
  const [subiendo, setSubiendo] = useState(false);
  const [fallo, setFallo] = useState(false);

  const pendiente = presentacion?.pendiente ?? null;
  const partidosPropios = pendiente?.partidos.length ?? 0;
  const jugadoresPropios = pendiente?.jugadores.length ?? 0;

  async function sumar() {
    setSubiendo(true);
    setFallo(false);
    const ok = await sumarYEntrar();
    setSubiendo(false);
    if (!ok) setFallo(true);
  }

  return (
    <AnimatePresence>
      {presentacion ? (
        <motion.div
          key="primera-vez"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-azul-950/85 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={resorte}
            className="w-full max-w-md border-[3px] border-tinta bg-crema px-5 py-6 shadow-[var(--golpe)] md:px-7 md:py-8"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.5, rotate: -14 }}
              animate={{ opacity: 1, scale: 1, rotate: -2.5 }}
              transition={golpe}
              className="rotulo inline-block border-2 border-tinta bg-naranja px-2.5 py-1.5 text-tinta shadow-[var(--golpe-chico)]"
            >
              Primera vez acá
            </motion.span>

            <h2 className="display mt-4 text-3xl leading-none text-tinta md:text-4xl">
              La liga es de todos
            </h2>

            <p className="mt-3 text-sm font-bold leading-relaxed text-tinta/75">
              Esta computadora se está conectando por primera vez. De ahora en más los partidos no
              se guardan acá adentro: viven en un solo lugar y todos ven lo mismo. Si alguien carga
              un resultado desde el celular, te aparece al instante sin recargar nada.
            </p>

            <p className="mt-3 border-l-4 border-tinta/15 pl-3 text-sm font-bold leading-relaxed text-tinta/60">
              Ahora mismo la liga tiene {presentacion.enLaLiga.jugadores}{" "}
              {presentacion.enLaLiga.jugadores === 1 ? "jugador" : "jugadores"} y{" "}
              {presentacion.enLaLiga.partidos}{" "}
              {presentacion.enLaLiga.partidos === 1 ? "partido" : "partidos"}.
            </p>

            {pendiente ? (
              <div className="mt-5 border-[3px] border-tinta bg-naranja/20 px-4 py-3">
                <p className="display text-lg leading-none text-tinta">
                  Tenés cosas guardadas acá
                </p>
                <p className="mt-2 text-xs font-bold leading-relaxed text-tinta/75">
                  En este navegador hay{" "}
                  {partidosPropios > 0 ? (
                    <strong>
                      {partidosPropios} {partidosPropios === 1 ? "partido" : "partidos"}
                    </strong>
                  ) : null}
                  {partidosPropios > 0 && jugadoresPropios > 0 ? " y " : null}
                  {jugadoresPropios > 0 ? (
                    <strong>
                      {jugadoresPropios} {jugadoresPropios === 1 ? "jugador" : "jugadores"}
                    </strong>
                  ) : null}{" "}
                  que en la liga no {partidosPropios + jugadoresPropios === 1 ? "está" : "están"}.
                  Se pueden sumar sin pisar nada de lo que ya hay.
                </p>
              </div>
            ) : null}

            {fallo ? (
              <p className="mt-4 border-[3px] border-tinta bg-naranja px-3 py-2 text-xs font-bold leading-relaxed text-tinta">
                No se pudieron subir. Fijate la conexión y probá de nuevo: no se perdió nada, siguen
                guardados en este navegador.
              </p>
            ) : null}

            <div className="mt-6 flex flex-col gap-2">
              {pendiente ? (
                <>
                  <Boton variante="naranja" tamano="lg" onClick={sumar} disabled={subiendo}>
                    {subiendo ? "Subiendo…" : "Sumarlos y entrar"}
                  </Boton>
                  <Boton
                    variante="fantasmaTinta"
                    tamano="md"
                    onClick={entrarALaLiga}
                    disabled={subiendo}
                  >
                    Entrar sin sumarlos
                  </Boton>
                </>
              ) : (
                <Boton variante="naranja" tamano="lg" onClick={entrarALaLiga}>
                  Entrar a la liga
                </Boton>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
