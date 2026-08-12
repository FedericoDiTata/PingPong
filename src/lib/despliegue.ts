/**
 * Dónde está corriendo la app.
 *
 * Vercel crea una URL nueva por cada push (las "vistas previas"), y el
 * navegador guarda los datos por dirección exacta. Entrar a una vista previa
 * es, para el almacenamiento, estrenar la app: aparece el historial inicial y
 * no están ni las fotos ni los partidos que cargaste. Es la causa más fácil de
 * confundir con un bug de guardado, así que la app tiene que poder detectarlo.
 *
 * Estas variables las inyecta Vercel sola. En local quedan sin definir, que es
 * exactamente lo que queremos: nada que avisar.
 */
const ENTORNO = process.env.NEXT_PUBLIC_VERCEL_ENV;
const DOMINIO_PRODUCCION = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;

export const esVistaPrevia = ENTORNO === "preview";

export const enlaceProduccion = DOMINIO_PRODUCCION ? `https://${DOMINIO_PRODUCCION}` : null;

/** "producción" · "vista previa" · "local", para mostrarle al usuario. */
export const nombreDelEntorno =
  ENTORNO === "production" ? "producción" : ENTORNO === "preview" ? "vista previa" : "local";
