/**
 * Fotos de perfil, fijas en el código.
 *
 * Los archivos viven en `public/jugadores/` y se despliegan con la app, así que
 * están en todos los teléfonos y en todas las direcciones sin depender del
 * almacenamiento del navegador. Es lo contrario de subirlas desde la app: no se
 * pueden cambiar sin tocar el repo, pero tampoco se pierden nunca.
 *
 * La clave es el id del jugador, no su nombre: renombrar a alguien no le
 * cambia la cara.
 *
 * Para sumar o cambiar una: poner el archivo en `public/jugadores/` y agregar
 * la línea acá. Si el archivo no está, el avatar cae solo al emoji.
 */
export const FOTOS: Record<string, string> = {
  fede: "/jugadores/fede.jpg",
  ernes: "/jugadores/ernes.jpg",
  fer: "/jugadores/fer.jpg",
  // Chris todavía no mandó la suya: mientras tanto le queda su emoji. Cuando
  // aparezca, va el archivo en public/jugadores/chris.jpg y se descomenta.
  // chris: "/jugadores/chris.jpg",
};

export function fotoDe(jugadorId: string): string | undefined {
  return FOTOS[jugadorId];
}
