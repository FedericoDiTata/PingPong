/**
 * Capa ambiente: la luz cenital sobre la mesa, la línea central y el grano.
 * Fija al viewport y sin eventos: existe para dar profundidad, no para mirarla.
 */
export function Fondo() {
  return (
    <div aria-hidden className="grano pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-mesa-950" />

      {/* Foco de luz sobre la mesa */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% -10%, oklch(0.32 0.055 250 / 0.85), transparent 62%)",
        }}
      />

      {/* Sombra hacia los bordes: mantiene la atención en el centro */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(100% 100% at 50% 40%, transparent 40%, oklch(0.11 0.025 252 / 0.75))",
        }}
      />

      {/* Línea central de la mesa */}
      <div className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-tiza/[0.045] lg:block" />
    </div>
  );
}
