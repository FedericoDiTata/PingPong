/**
 * Set de iconos propio. Trazo 1.6, puntas redondeadas, grilla de 24.
 * Dibujarlos a mano cuesta veinte minutos y evita el look de librería
 * genérica que tienen todas las apps iguales.
 */
type Props = React.SVGProps<SVGSVGElement>;

function Base({ children, ...props }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconoPodio(props: Props) {
  return (
    <Base {...props}>
      <path d="M4 20h16" />
      <path d="M9 20v-7h6v7" />
      <path d="M3.5 20v-4H9" />
      <path d="M15 16h5.5v4" />
      <path d="M12 4.2 13.1 7l3 .2-2.3 1.9.7 2.9L12 10.4 9.5 12l.7-2.9L7.9 7.2l3-.2z" />
    </Base>
  );
}

export function IconoPaleta(props: Props) {
  return (
    <Base {...props}>
      <path d="M14.8 14.4c2.6-1.2 4-4.2 3-7A5.9 5.9 0 0 0 9 4.2c-2.6 1.2-4 4.2-3 7a5.9 5.9 0 0 0 8.8 3.2Z" />
      <path d="m11.6 14.9-3.1 5.4a1.6 1.6 0 0 1-2.8-1.6l3.1-5.4" />
      <circle cx="17.6" cy="17.6" r="2.1" />
    </Base>
  );
}

export function IconoHistorial(props: Props) {
  return (
    <Base {...props}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3 4v4h4" />
      <path d="M12 7.8V12l2.8 1.7" />
    </Base>
  );
}

export function IconoJugadores(props: Props) {
  return (
    <Base {...props}>
      <circle cx="9.5" cy="8" r="3.2" />
      <path d="M3.5 19.5c.7-3.2 3.1-5 6-5s5.3 1.8 6 5" />
      <path d="M16.5 5.4a3.2 3.2 0 0 1 0 5.9" />
      <path d="M18.2 14.9c1.5.7 2.6 2.2 3 4.6" />
    </Base>
  );
}

export function IconoMas(props: Props) {
  return (
    <Base {...props}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Base>
  );
}

export function IconoDeshacer(props: Props) {
  return (
    <Base {...props}>
      <path d="M4 9h10.5a5 5 0 0 1 0 10H9" />
      <path d="M7.5 5.5 4 9l3.5 3.5" />
    </Base>
  );
}

export function IconoCerrar(props: Props) {
  return (
    <Base {...props}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </Base>
  );
}

export function IconoFlecha(props: Props) {
  return (
    <Base {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Base>
  );
}

export function IconoVolver(props: Props) {
  return (
    <Base {...props}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Base>
  );
}

export function IconoBajar(props: Props) {
  return (
    <Base {...props}>
      <path d="M12 4v13M6 11.5l6 6 6-6" />
    </Base>
  );
}

export function IconoSubir(props: Props) {
  return (
    <Base {...props}>
      <path d="M12 20V7M6 12.5l6-6 6 6" />
    </Base>
  );
}

export function IconoBasura(props: Props) {
  return (
    <Base {...props}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5.2c0-.7.5-1.2 1.2-1.2h2.6c.7 0 1.2.5 1.2 1.2V7" />
      <path d="M6.5 7.5 7.3 19c0 .9.7 1.5 1.5 1.5h6.4c.8 0 1.5-.6 1.5-1.5l.8-11.5" />
      <path d="M10.5 11v5.5M13.5 11v5.5" />
    </Base>
  );
}

export function IconoLapiz(props: Props) {
  return (
    <Base {...props}>
      <path d="M15.6 4.9 19.1 8.4 8.9 18.6 4.4 19.6l1-4.5z" />
      <path d="m13.4 7.1 3.5 3.5" />
    </Base>
  );
}

export function IconoIntercambio(props: Props) {
  return (
    <Base {...props}>
      <path d="M4 8h13M14 5l3 3-3 3" />
      <path d="M20 16H7M10 13l-3 3 3 3" />
    </Base>
  );
}

export function IconoRayo(props: Props) {
  return (
    <Base {...props}>
      <path d="M13.2 2.5 5 13.4h5.6l-.8 8.1 8.2-11h-5.6z" />
    </Base>
  );
}

export function IconoCheck(props: Props) {
  return (
    <Base {...props}>
      <path d="m5 12.8 4.4 4.4L19 7.5" />
    </Base>
  );
}

export function IconoFuego(props: Props) {
  return (
    <Base {...props}>
      <path d="M12 3s5.2 3.6 5.2 8.6a5.2 5.2 0 0 1-10.4 0C6.8 9.4 8 8.3 8 8.3s.4 2 1.8 2.5C10.4 8.5 12 7.2 12 3Z" />
      <path d="M12 20.8a2.6 2.6 0 0 0 2.6-2.6c0-1.9-2.6-3.4-2.6-3.4s-2.6 1.5-2.6 3.4a2.6 2.6 0 0 0 2.6 2.6Z" />
    </Base>
  );
}

export function IconoDescargar(props: Props) {
  return (
    <Base {...props}>
      <path d="M12 3.5v11M7.5 10l4.5 4.5L16.5 10" />
      <path d="M4.5 17.5v1.2c0 .9.7 1.6 1.6 1.6h11.8c.9 0 1.6-.7 1.6-1.6v-1.2" />
    </Base>
  );
}

export function IconoImportar(props: Props) {
  return (
    <Base {...props}>
      <path d="M12 14.5v-11M7.5 8 12 3.5 16.5 8" />
      <path d="M4.5 17.5v1.2c0 .9.7 1.6 1.6 1.6h11.8c.9 0 1.6-.7 1.6-1.6v-1.2" />
    </Base>
  );
}

export function IconoGrafico(props: Props) {
  return (
    <Base {...props}>
      <path d="M4 19.5V4.5" />
      <path d="M4 19.5h16" />
      <path d="m7 15 3.6-4.4 3 2.4L20 6.5" />
    </Base>
  );
}
