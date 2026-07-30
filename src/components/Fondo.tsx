/**
 * Capa ambiente: azul de mesa, trama de impresión y grano. Fija al viewport,
 * sin eventos. Existe para que el fondo se sienta impreso, no renderizado.
 */
export function Fondo() {
  return (
    <div aria-hidden className="grano pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-azul-900" />

      {/* Trama de puntos, más densa arriba */}
      <div className="trama absolute inset-0 opacity-60" />

      {/* Luz sobre la mesa */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 60% at 50% -8%, oklch(0.45 0.16 258 / 0.75), transparent 65%)",
        }}
      />

      {/* Sombra hacia los bordes */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(100% 100% at 50% 45%, transparent 35%, oklch(0.16 0.08 266 / 0.8))",
        }}
      />

      {/* Línea central de la mesa */}
      <div className="absolute inset-y-0 left-1/2 hidden w-[3px] -translate-x-1/2 bg-crema/8 lg:block" />
    </div>
  );
}
