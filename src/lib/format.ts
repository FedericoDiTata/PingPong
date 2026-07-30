const DIA = 86_400_000;

export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export function fechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

/** "recién", "hace 40 min", "ayer", "hace 6 días", "12 mar". */
export function relativo(iso: string): string {
  const fecha = new Date(iso).getTime();
  const ahora = Date.now();
  const diferencia = ahora - fecha;

  if (diferencia < 60_000) return "recién";
  if (diferencia < 3_600_000) return `hace ${Math.floor(diferencia / 60_000)} min`;
  if (diferencia < DIA) return `hace ${Math.floor(diferencia / 3_600_000)} h`;

  const hoy = new Date(ahora).setHours(0, 0, 0, 0);
  const dia = new Date(fecha).setHours(0, 0, 0, 0);
  const dias = Math.round((hoy - dia) / DIA);

  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;
  if (dias < 30) return `hace ${Math.floor(dias / 7)} sem`;
  return fechaCorta(iso);
}

/** Agrupador para el historial: "Hoy", "Ayer", "Jueves 24 de julio". */
export function etiquetaDia(iso: string): string {
  const hoy = new Date().setHours(0, 0, 0, 0);
  const dia = new Date(iso).setHours(0, 0, 0, 0);
  const dias = Math.round((hoy - dia) / DIA);

  if (dias === 0) return "Hoy";
  if (dias === 1) return "Ayer";
  return fechaLarga(iso);
}

export function conSigno(valor: number): string {
  return valor > 0 ? `+${valor}` : `${valor}`;
}

export function porcentaje(valor: number): string {
  return `${Math.round(valor * 100)}%`;
}

export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}
