"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";
import { golpe } from "@/lib/motion";

/* ---------------------------------------------------------------- Botón --- */

type VarianteBoton = "naranja" | "crema" | "azul" | "fantasma" | "peligro";
type TamanoBoton = "sm" | "md" | "lg" | "xl";

// Un botón apagado no es "el mismo color más transparente": eso sigue
// pareciendo apretable. Pasa a ser un bloque hundido, sin sombra.
const APAGADO = "disabled:bg-azul-950 disabled:text-crema/35 disabled:border-tinta disabled:shadow-none";

const VARIANTES: Record<VarianteBoton, string> = {
  naranja: `bg-naranja text-tinta border-tinta shadow-[var(--golpe)] hover:bg-naranja-claro ${APAGADO}`,
  crema: `bg-crema text-tinta border-tinta shadow-[var(--golpe)] hover:bg-hueso ${APAGADO}`,
  azul: `bg-azul-700 text-crema border-tinta shadow-[var(--golpe)] hover:bg-azul-500 ${APAGADO}`,
  fantasma:
    "bg-transparent text-crema border-crema/35 hover:border-crema hover:bg-crema/10 disabled:opacity-40",
  peligro:
    "bg-transparent text-naranja-claro border-naranja/50 hover:bg-naranja/15 disabled:opacity-40",
};

const TAMANOS: Record<TamanoBoton, string> = {
  sm: "h-9 px-3 text-2xs gap-1.5 rounded-sm",
  md: "h-11 px-4 text-xs gap-2 rounded-md",
  lg: "h-14 px-6 text-sm gap-2.5 rounded-md",
  xl: "h-20 px-8 text-lg gap-3 rounded-lg",
};

export function Boton({
  variante = "crema",
  tamano = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
}) {
  const conSombra = variante !== "fantasma" && variante !== "peligro";

  return (
    <button
      className={`inline-flex select-none items-center justify-center whitespace-nowrap border-[3px] font-bold uppercase tracking-[0.08em] transition-[transform,box-shadow,background-color,border-color] duration-100 ease-quart disabled:pointer-events-none ${
        conSombra ? "active:translate-x-[4px] active:translate-y-[4px] active:shadow-none" : ""
      } ${VARIANTES[variante]} ${TAMANOS[tamano]} ${className}`}
      {...props}
    />
  );
}

/* --------------------------------------------------------------- Campos --- */

export function Campo({
  etiqueta,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { etiqueta?: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      {etiqueta ? (
        <label htmlFor={id} className="rotulo text-crema/70">
          {etiqueta}
        </label>
      ) : null}
      <input
        id={id}
        className={`h-13 w-full rounded-md border-[3px] border-tinta bg-crema px-4 text-lg font-semibold text-tinta shadow-[var(--golpe-chico)] outline-none transition-colors duration-100 placeholder:font-normal placeholder:text-tinta/35 focus:bg-naranja-claro ${className}`}
        {...props}
      />
    </div>
  );
}

/* ----------------------------------------------------------- Segmentado --- */

export function Segmentado<T extends string>({
  opciones,
  valor,
  onCambio,
  idGrupo,
  className = "",
}: {
  opciones: Array<{ valor: T; texto: string }>;
  valor: T;
  onCambio: (valor: T) => void;
  idGrupo: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex gap-1 rounded-md border-[3px] border-tinta bg-azul-950 p-1 shadow-[var(--golpe-chico)] ${className}`}
    >
      {opciones.map((opcion) => {
        const activo = opcion.valor === valor;
        return (
          <button
            key={opcion.valor}
            role="tab"
            aria-selected={activo}
            onClick={() => onCambio(opcion.valor)}
            className={`relative flex-1 rounded-sm px-3.5 py-2.5 text-2xs font-bold uppercase tracking-[0.1em] transition-colors duration-100 ${
              activo ? "text-tinta" : "text-crema/55 hover:text-crema"
            }`}
          >
            {activo ? (
              <motion.span
                layoutId={`segmento-${idGrupo}`}
                className="absolute inset-0 rounded-sm bg-naranja"
                transition={{ type: "spring", stiffness: 520, damping: 32 }}
              />
            ) : null}
            <span className="relative">{opcion.texto}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------- Secciones --- */

export function TituloSeccion({
  rotulo,
  titulo,
  accion,
}: {
  rotulo?: string;
  titulo: string;
  accion?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-2">
        {rotulo ? (
          <span className="rotulo w-fit -rotate-1 bg-naranja px-2 py-1 text-tinta">{rotulo}</span>
        ) : null}
        <h2 className="display text-2xl text-crema md:text-3xl">{titulo}</h2>
      </div>
      {accion}
    </div>
  );
}

/**
 * Cinta corrida: el zócalo de un club. Decorativa, pero con contenido real.
 * Duplica la lista para que el loop no tenga costura visible.
 */
export function Cinta({ items, className = "" }: { items: string[]; className?: string }) {
  if (items.length === 0) return null;

  // Con pocos resultados la cinta quedaría corta y se vería el hueco.
  const relleno: string[] = [];
  while (relleno.length < 8) relleno.push(...items);

  return (
    <div
      aria-hidden
      className={`overflow-hidden border-y-[3px] border-tinta bg-naranja py-2 ${className}`}
    >
      <div className="flex w-max animate-cinta">
        {[0, 1].map((copia) => (
          <div key={copia} className="flex shrink-0">
            {relleno.map((parte, indice) => (
              <span
                key={`${copia}-${indice}`}
                className="display whitespace-nowrap px-4 text-lg text-tinta"
              >
                {parte} <span className="text-tinta/40">●</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- Confirmar --- */

export function ConfirmarEnLinea({
  children,
  pregunta = "¿Seguro?",
  textoConfirmar = "Borrar",
  onConfirmar,
}: {
  children: (abrir: () => void) => React.ReactNode;
  pregunta?: string;
  textoConfirmar?: string;
  onConfirmar: () => void;
}) {
  const [abierto, setAbierto] = useState(false);

  if (!abierto) return <>{children(() => setAbierto(true))}</>;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={golpe}
      className="flex items-center gap-2"
    >
      <span className="rotulo text-tinta/60">{pregunta}</span>
      <Boton
        tamano="sm"
        variante="naranja"
        onClick={() => {
          setAbierto(false);
          onConfirmar();
        }}
      >
        {textoConfirmar}
      </Boton>
      <Boton tamano="sm" variante="fantasma" onClick={() => setAbierto(false)}>
        No
      </Boton>
    </motion.div>
  );
}

/* ------------------------------------------------------------- Vacío --- */

export function EstadoVacio({
  titulo,
  detalle,
  accion,
}: {
  titulo: string;
  detalle: string;
  accion?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: -1 }}
      transition={golpe}
      className="cartel rounded-lg px-6 py-12 text-center"
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-4">
        <span className="text-5xl">🏓</span>
        <h3 className="display text-3xl text-tinta">{titulo}</h3>
        <p className="max-w-[42ch] text-sm font-medium leading-relaxed text-tinta/70">{detalle}</p>
        {accion ? <div className="mt-2 flex flex-wrap justify-center gap-3">{accion}</div> : null}
      </div>
    </motion.div>
  );
}
