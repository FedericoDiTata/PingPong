"use client";

import Link from "next/link";
import { CargarResultado } from "@/components/CargarResultado";
import { Cargando, Encabezado, Pagina } from "@/components/Pagina";
import { Boton, EstadoVacio } from "@/components/ui";
import { useLiga } from "@/lib/store";

export default function PaginaCargar() {
  const { liga, hidratado, agregarPartido, borrarPartido } = useLiga();

  if (!hidratado) {
    return (
      <Pagina>
        <Encabezado rotulo="Anotá" titulo="Cargar resultado" />
        <Cargando />
      </Pagina>
    );
  }

  if (liga.jugadores.length < 2) {
    return (
      <Pagina>
        <Encabezado rotulo="Anotá" titulo="Cargar resultado" />
        <EstadoVacio
          titulo="Faltan jugadores"
          detalle="Para anotar un partido tiene que haber al menos dos personas en la liga."
          accion={
            <Link href="/jugadores">
              <Boton variante="naranja" tamano="lg">
                Agregar jugadores
              </Boton>
            </Link>
          }
        />
      </Pagina>
    );
  }

  return (
    <Pagina>
      <Encabezado
        rotulo="Anotá"
        titulo="Cargar resultado"
        bajada="Quién jugó contra quién y quién ganó. El marcador exacto es opcional: cargalo sólo si se acuerdan."
      />

      <CargarResultado liga={liga} onGuardar={agregarPartido} onBorrar={borrarPartido} />
    </Pagina>
  );
}
