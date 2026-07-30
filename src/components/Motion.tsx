"use client";

import { MotionConfig } from "motion/react";

/**
 * `reducedMotion="user"` deja que Framer respete la preferencia del sistema:
 * anula movimientos de transform y layout, y conserva los fundidos.
 *
 * Es mejor que decidirlo a mano en cada componente con `useReducedMotion`,
 * porque ese hook devuelve distinto en el servidor que en el cliente y rompe
 * la hidratación de quien tiene el movimiento reducido activado.
 */
export function ConfiguracionMovimiento({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
