"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";

/* ---------------------------------------------------------------- Botón --- */

type VarianteBoton = "primario" | "secundario" | "fantasma" | "peligro";
type TamanoBoton = "sm" | "md" | "lg";

// El deshabilitado del botón primario no es "el mismo naranja más apagado":
// eso da un marrón sucio que sigue pareciendo pulsable. Pasa a ser una
// superficie neutra, que es lo que un control inerte tiene que parecer.
const VARIANTES: Record<VarianteBoton, string> = {
  primario:
    "bg-pelota text-mesa-950 font-semibold hover:bg-pelota-alta active:bg-pelota-baja shadow-[0_1px_0_0_oklch(1_0_0/0.25)_inset] disabled:bg-mesa-800 disabled:text-tiza-25 disabled:shadow-none",
  secundario:
    "bg-mesa-800 text-tiza border border-[var(--borde-fuerte)] hover:bg-mesa-700 active:bg-mesa-800 disabled:opacity-45",
  fantasma: "text-tiza-70 hover:text-tiza hover:bg-mesa-800/70 active:bg-mesa-800 disabled:opacity-45",
  peligro:
    "text-pierde border border-transparent hover:bg-pierde/12 hover:border-pierde/30 disabled:opacity-45",
};

const TAMANOS: Record<TamanoBoton, string> = {
  sm: "h-8 px-3 text-xs rounded-sm gap-1.5",
  md: "h-10 px-4 text-sm rounded-md gap-2",
  lg: "h-13 px-6 text-base rounded-md gap-2.5",
};

export function Boton({
  variante = "secundario",
  tamano = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
}) {
  return (
    <button
      className={`inline-flex select-none items-center justify-center whitespace-nowrap transition-[background-color,color,border-color,transform] duration-[120ms] ease-quart active:scale-[0.985] disabled:pointer-events-none ${VARIANTES[variante]} ${TAMANOS[tamano]} ${className}`}
      {...props}
    />
  );
}

/* --------------------------------------------------------------- Campos --- */

export function Campo({
  etiqueta,
  sufijo,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  etiqueta?: string;
  sufijo?: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      {etiqueta ? (
        <label htmlFor={id} className="etiqueta">
          {etiqueta}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={id}
          className={`h-11 w-full rounded-md border border-[var(--borde)] bg-mesa-850 px-3.5 text-base text-tiza outline-none transition-colors duration-[120ms] placeholder:text-tiza-25 hover:border-[var(--borde-fuerte)] focus:border-pelota/60 focus:bg-mesa-800 ${className}`}
          {...props}
        />
        {sufijo ? (
          <span className="absolute inset-y-0 right-3 flex items-center text-xs text-tiza-45">
            {sufijo}
          </span>
        ) : null}
      </div>
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
  opciones: Array<{ valor: T; texto: string; icono?: React.ReactNode }>;
  valor: T;
  onCambio: (valor: T) => void;
  idGrupo: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex rounded-md border border-[var(--borde)] bg-mesa-900 p-1 ${className}`}
    >
      {opciones.map((opcion) => {
        const activo = opcion.valor === valor;
        return (
          <button
            key={opcion.valor}
            role="tab"
            aria-selected={activo}
            onClick={() => onCambio(opcion.valor)}
            className={`relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3.5 py-2 text-sm transition-colors duration-[120ms] ${
              activo ? "text-mesa-950" : "text-tiza-45 hover:text-tiza-70"
            }`}
          >
            {activo ? (
              <motion.span
                layoutId={`segmento-${idGrupo}`}
                className="absolute inset-0 rounded-sm bg-tiza"
                transition={{ type: "spring", stiffness: 520, damping: 42 }}
              />
            ) : null}
            <span className="relative z-10 flex items-center gap-1.5 font-medium">
              {opcion.icono}
              {opcion.texto}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------- Secciones --- */

export function TituloSeccion({
  etiqueta,
  titulo,
  accion,
}: {
  etiqueta?: string;
  titulo: string;
  accion?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        {etiqueta ? <span className="etiqueta">{etiqueta}</span> : null}
        <h2 className="text-xl font-semibold tracking-[-0.01em] text-tiza">{titulo}</h2>
      </div>
      {accion}
    </div>
  );
}

/* -------------------------------------------------------------- Confirmar --- */

/**
 * Confirmación en línea: el propio control se convierte en la pregunta.
 * Un modal para "¿borrar este partido?" es artillería pesada de más.
 */
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
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
      className="flex items-center gap-2"
    >
      <span className="text-xs text-tiza-45">{pregunta}</span>
      <Boton
        tamano="sm"
        variante="peligro"
        className="border-pierde/40 bg-pierde/12"
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
  icono,
}: {
  titulo: string;
  detalle: string;
  accion?: React.ReactNode;
  icono?: React.ReactNode;
}) {
  return (
    <div className="panel relative overflow-hidden rounded-lg px-6 py-14 text-center">
      <div className="relative mx-auto flex max-w-sm flex-col items-center gap-4">
        {icono ? <div className="text-tiza-25">{icono}</div> : null}
        <h3 className="text-lg font-semibold text-tiza">{titulo}</h3>
        <p className="text-sm leading-relaxed text-tiza-45">{detalle}</p>
        {accion ? <div className="mt-2 flex flex-wrap justify-center gap-2">{accion}</div> : null}
      </div>
    </div>
  );
}
