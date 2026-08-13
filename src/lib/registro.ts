import type { Liga } from "./liga";
import type { Jugador, Movimiento, Partido } from "./types";

/**
 * Traduce una línea del registro a una frase.
 *
 * Los nombres salen de la foto guardada en el movimiento antes que de la liga
 * actual: si borraron al jugador, la liga ya no lo tiene y el registro tiene
 * que seguir contando qué pasó.
 */
export function describir(movimiento: Movimiento, liga: Liga): string {
  const nombreDe = (id: string) => liga.porId[id]?.nombre ?? "alguien que ya no está";

  if (movimiento.entidad === "partido") {
    const foto = (movimiento.despues ?? movimiento.antes) as Partido | undefined;
    if (!foto) return movimiento.tipo === "alta" ? "anotó un partido" : "borró un partido";

    const ganador = nombreDe(foto.ganador);
    const perdedor = nombreDe(foto.ganador === foto.jugadorA ? foto.jugadorB : foto.jugadorA);

    const marcador =
      foto.puntosA !== undefined && foto.puntosB !== undefined
        ? ` ${Math.max(foto.puntosA, foto.puntosB)}–${Math.min(foto.puntosA, foto.puntosB)}`
        : "";

    return movimiento.tipo === "alta"
      ? `anotó que ${ganador} le ganó a ${perdedor}${marcador}`
      : `borró el partido de ${ganador} contra ${perdedor}`;
  }

  const antes = movimiento.antes as Jugador | undefined;
  const despues = movimiento.despues as Jugador | undefined;

  if (movimiento.tipo === "alta") return `sumó a ${despues?.nombre ?? "alguien"} a la liga`;
  if (movimiento.tipo === "baja") {
    return `sacó a ${antes?.nombre ?? "alguien"} de la liga, con todos sus partidos`;
  }

  if (antes && despues && antes.nombre !== despues.nombre) {
    return `${antes.nombre} pasó a llamarse ${despues.nombre}`;
  }
  return `le cambió el emoji a ${despues?.nombre ?? "alguien"}`;
}
