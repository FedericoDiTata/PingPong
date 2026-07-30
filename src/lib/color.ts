/**
 * Cada jugador recibe un color y una inclinación estables, derivados de su id.
 * Los tonos salen de una lista curada que convive con el azul y el naranja de
 * la marca: nada de HSL aleatorio, que produce colores lodo.
 *
 * La inclinación es la que hace que los avatares parezcan calcomanías pegadas
 * a mano y no una grilla perfecta.
 */
const TONOS = [
  { fondo: "oklch(0.78 0.17 55)", fuerte: "oklch(0.72 0.2 47)" }, // naranja
  { fondo: "oklch(0.72 0.16 152)", fuerte: "oklch(0.66 0.17 152)" }, // verde
  { fondo: "oklch(0.75 0.15 200)", fuerte: "oklch(0.68 0.16 205)" }, // celeste
  { fondo: "oklch(0.76 0.16 20)", fuerte: "oklch(0.66 0.19 22)" }, // rojo
  { fondo: "oklch(0.8 0.16 92)", fuerte: "oklch(0.74 0.17 88)" }, // amarillo
  { fondo: "oklch(0.74 0.14 300)", fuerte: "oklch(0.66 0.16 300)" }, // violeta
  { fondo: "oklch(0.78 0.13 340)", fuerte: "oklch(0.7 0.16 345)" }, // rosa
  { fondo: "oklch(0.7 0.13 250)", fuerte: "oklch(0.62 0.16 252)" }, // azul
];

const INCLINACIONES = [-3, 2.5, -1.5, 3, -2, 1.5, -2.5, 2];

function hash(texto: string): number {
  let valor = 0;
  for (let i = 0; i < texto.length; i += 1) {
    valor = (valor << 5) - valor + texto.charCodeAt(i);
    valor |= 0;
  }
  return Math.abs(valor);
}

export type TonoJugador = {
  fondo: string;
  fuerte: string;
  inclinacion: number;
};

export function tonoJugador(id: string): TonoJugador {
  const indice = hash(id) % TONOS.length;
  return {
    ...TONOS[indice],
    inclinacion: INCLINACIONES[hash(`${id}-giro`) % INCLINACIONES.length],
  };
}
