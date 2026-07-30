# Mesa · liga de ping pong

App web para llevar el ranking de los partidos de ping pong entre amigos. Marcador en vivo punto
por punto, historial completo, puntaje ELO y estadísticas por jugador.

Funciona en el celular apoyado al lado de la red: sin cuentas, sin servidor y sin conexión.

---

## Cómo se usa

1. **Cargá a los jugadores** una sola vez en la pestaña *Jugadores*. Todos arrancan en 1000 puntos.
2. **Anotá partidos** en *Partido*. Dos maneras:
   - **En vivo**: elegís los dos jugadores y tocás cada mitad de la pantalla para sumar puntos. La
     app lleva el saque, los deuces, el fin de cada game y el fin del partido. Cuando termina, se
     guarda solo.
   - **Cargar resultado**: escribís los games de un partido que ya jugaron (11-8, 9-11, 11-6...).
3. **Mirá el ranking**. Cada resultado recalcula puestos, rachas y puntaje.

Atajos en el partido en vivo: `←` suma punto al jugador de la izquierda, `→` al de la derecha,
`Backspace` deshace el último punto. La pantalla no se apaga mientras jugás.

---

## Cómo funciona el puntaje

Es un ELO (el sistema del ajedrez) con tres cambios pensados para una liga chica:

- **Todos arrancan en 1000.** Número redondo, fácil de leer.
- **El factor K baja con la experiencia.** Los primeros 5 partidos mueven mucho (K=48), entre el 5
  y el 15 menos (K=32), después se estabiliza (K=24). Así el ranking se ordena rápido al principio
  y no lo da vuelta un partido suelto más adelante.
- **Ganar 3-0 vale más que ganar 3-2.** Un multiplicador premia la diferencia de sets.

Ganarle a alguien que tiene más puntos que vos suma más; perder contra alguien de menos puntos
cuesta más. Es simétrico: lo que uno gana, el otro lo pierde.

El puntaje **no se guarda**: se recalcula reproduciendo todos los partidos en orden cada vez que
algo cambia. Por eso podés borrar un partido cargado por error y toda la tabla se corrige sola.

---

## Dónde viven los datos

Todo se guarda en el `localStorage` del navegador que usás. Ventajas: no hay que crear cuenta,
anda sin internet y nadie más ve tus datos. Contra: **la liga vive en ese navegador**.

Para moverla o compartirla, en *Jugadores → Los datos son tuyos*:

- **Descargar liga**: baja un `.json` con todo.
- **Importar archivo**: reemplaza los datos de este navegador con los de un archivo.

Si en algún momento quieren que todos vean la misma liga en tiempo real desde sus propios
teléfonos, hay que agregar una base de datos. La app está preparada: toda la lectura y escritura
pasa por `src/lib/store.ts`, así que se cambia ese archivo y nada más.

---

## Correrlo en tu computadora

```bash
npm install
npm run dev
```

Abre en `http://localhost:3000`.

```bash
npm run build   # compila para producción
npm run start   # sirve la versión compilada
npm run lint    # revisa el código
```

## Publicarlo

Es una app estática: sirve cualquier hosting. Lo más rápido es Vercel — importás el repo y no hay
nada que configurar (no usa variables de entorno ni base de datos).

Una vez publicada, desde el celular se puede agregar a la pantalla de inicio y se abre como una
app (tiene manifest y modo standalone).

---

## Stack

- **Next.js 16** (App Router) y **React 19**
- **TypeScript**
- **Tailwind CSS v4** — los tokens de diseño están en `src/app/globals.css`
- **Motion** (Framer Motion) para las animaciones

## Estructura

```
src/
  app/
    page.tsx              Ranking: podio + tabla de posiciones
    partido/              Marcador en vivo y carga manual
    historial/            Todos los partidos, agrupados por día
    jugadores/            Alta, edición, respaldo e importación
    jugador/[id]/         Perfil: curva de puntaje, stats y cara a cara
    globals.css           Sistema de diseño completo (colores, tipografía, motion)
  components/             UI: cada pieza visual de la app
  lib/
    types.ts              Modelo de datos
    elo.ts                Cálculo del puntaje
    liga.ts               Deriva tabla, rachas y estadísticas de los partidos
    vivo.ts               Reglas del partido en vivo (saque, deuce, fin de game)
    store.ts              Estado + persistencia en localStorage
    demo.ts               Liga de ejemplo (simula los partidos punto por punto)
```

## Ideas para más adelante

- Liga compartida en la nube (Supabase) para que cada uno la vea desde su teléfono.
- Dobles (2 vs 2).
- Torneos con llave de eliminación.
- Récords de la liga: partido más largo, remontada más grande, mayor racha histórica.
