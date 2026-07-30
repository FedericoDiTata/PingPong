/** Lado del recorte final, en píxeles. */
const LADO = 256;

/**
 * Convierte la imagen que eligió el usuario en un cuadrado chico y liviano.
 *
 * El recorte es centrado y tipo "cover": la foto llena el cuadrado sin
 * deformarse. Comprimir es obligatorio, no una optimización: la liga entera
 * vive en localStorage, que tiene unos 5 MB, y una foto sacada con el celular
 * pesa varios megas ella sola. A 256 px y calidad 0,82 queda en unos 15 KB.
 */
export async function recortarFoto(archivo: File): Promise<string> {
  if (!archivo.type.startsWith("image/")) {
    throw new Error("Ese archivo no es una imagen.");
  }

  const imagen = await createImageBitmap(archivo);

  try {
    const lienzo = document.createElement("canvas");
    lienzo.width = LADO;
    lienzo.height = LADO;

    const pincel = lienzo.getContext("2d");
    if (!pincel) throw new Error("No se pudo procesar la imagen.");

    const escala = Math.max(LADO / imagen.width, LADO / imagen.height);
    const ancho = imagen.width * escala;
    const alto = imagen.height * escala;

    pincel.drawImage(imagen, (LADO - ancho) / 2, (LADO - alto) / 2, ancho, alto);

    return lienzo.toDataURL("image/jpeg", 0.82);
  } finally {
    imagen.close();
  }
}
