/**
 * Cada jugador recibe un tono estable derivado de su id. Los tonos salen de
 * una lista curada que convive con el azul de la mesa: nada de HSL aleatorio,
 * que es lo que produce esos colores lodo imposibles de distinguir.
 */
const TONOS = [28, 62, 108, 158, 195, 232, 292, 330];

function hash(texto: string): number {
  let valor = 0;
  for (let i = 0; i < texto.length; i += 1) {
    valor = (valor << 5) - valor + texto.charCodeAt(i);
    valor |= 0;
  }
  return Math.abs(valor);
}

export type TonoJugador = {
  /** Trazo de gráficos y detalles finos. */
  fuerte: string;
  /** Relleno de avatares. */
  fondo: string;
  /** Anillos y bordes. */
  borde: string;
  /** Halos y fondos de barra. */
  tenue: string;
};

export function tonoJugador(id: string): TonoJugador {
  const tono = TONOS[hash(id) % TONOS.length];
  return {
    fuerte: `oklch(0.78 0.14 ${tono})`,
    fondo: `oklch(0.32 0.062 ${tono})`,
    borde: `oklch(0.78 0.14 ${tono} / 0.32)`,
    tenue: `oklch(0.78 0.14 ${tono} / 0.12)`,
  };
}
