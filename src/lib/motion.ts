import type { Transition } from "motion/react";

/**
 * Presets de movimiento. Acá el rebote es intencional: la app tiene que
 * sentirse física y ruidosa, como fichas de madera cayendo sobre la mesa.
 * `MotionConfig reducedMotion="user"` desactiva los desplazamientos para quien
 * los tenga apagados en el sistema, así que el exceso nunca es un problema.
 */

/** Entrada de bloques: rebota una vez y frena. */
export const resorte: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 15,
  mass: 0.9,
};

/** Para cosas que se reordenan: firme, sin rebote largo. */
export const resorteFirme: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 30,
};

/** Golpe seco: lo que aparece de la nada y se planta. */
export const golpe: Transition = {
  type: "spring",
  stiffness: 700,
  damping: 20,
  mass: 0.7,
};

/** Retardo escalonado, con tope para que una lista larga no tarde una eternidad. */
export function escalonar(indice: number, paso = 0.045, tope = 12): number {
  return Math.min(indice, tope) * paso;
}
