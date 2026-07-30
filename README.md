# Mesa · liga de ping pong

App web para llevar el registro de los partidos de ping pong entre amigos: **quién jugó contra
quién, quién ganó y cómo queda la tabla**. El marcador exacto es opcional, porque en la vida real
casi siempre queda "le ganó Fede" y nada más.

Todos los partidos son a **un game de 11**.

---

## Cómo se usa

1. **Cargá a los jugadores** una sola vez en la pestaña *Jugadores*. Todos arrancan en 1000 puntos.
2. **Anotá los resultados** en *Cargar*. Son tres toques:
   - tocás a los dos que jugaron,
   - tocás al que ganó,
   - guardás.
   Si se acuerdan del marcador, hay un paso opcional: se toca cuántos puntos hizo el que perdió
   (0 a 9) y listo. Para los partidos peleados hay un botón *Deuce* que deja escribir 12-10, 13-11
   o lo que haya salido.
3. **Mirá el ranking**. Cada resultado recalcula puestos, rachas y puntaje.

La pantalla de carga está pensada para descargar una tanda de partidos viejos de una sentada: se
guarda, la pareja se limpia sola, y abajo queda la lista de lo recién cargado con un botón para
deshacer si te equivocaste.

---

## Qué se puede ver de cada jugador

En el perfil (se entra tocando cualquier nombre):

- **Ganados, perdidos y jugados**, con el porcentaje de efectividad.
- **Contra cada rival**: el historial cara a cara con cada uno (5-2, 3-0, etc.), una barra con la
  proporción y quién le gana a quién.
- Su **víctima favorita** y su **bestia negra**.
- Mejor y peor racha, pico histórico de puntaje y la curva de cómo viene partido a partido.

---

## Cómo funciona el puntaje

Es un ELO (el sistema del ajedrez) con tres cambios pensados para una liga chica:

- **Todos arrancan en 1000.** Número redondo, fácil de leer.
- **El factor K baja con la experiencia.** Los primeros 5 partidos mueven mucho (K=48), entre el 5
  y el 15 menos (K=32), después se estabiliza (K=24). El ranking se ordena rápido al principio y no
  lo da vuelta un partido suelto más adelante.
- **Una paliza vale un poco más**, pero sólo si cargaste el marcador. Si el partido se anotó sin
  puntos, cuenta como uno normal: nadie tiene que anotar el resultado exacto para que esto funcione.

Ganarle a alguien con más puntos que vos suma más; perder contra alguien de menos puntos cuesta
más. Es simétrico: lo que uno gana, el otro lo pierde.

El puntaje **no se guarda**: se recalcula reproduciendo todos los partidos en orden cada vez que
algo cambia. Por eso podés borrar un partido cargado por error y toda la tabla se corrige sola.

---

## Dónde viven los datos

Todo se guarda en el `localStorage` del navegador que usás. Ventajas: no hay que crear cuenta, anda
sin internet y nadie más ve tus datos. Contra: **la liga vive en ese navegador**.

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

Una vez publicada, desde el celular se puede agregar a la pantalla de inicio y se abre como una app.

---

## Stack

- **Next.js 16** (App Router) y **React 19**
- **TypeScript**
- **Tailwind CSS v4** — los tokens de diseño están en `src/app/globals.css`
- **Motion** (Framer Motion) para las animaciones
- Tipografías **Anton** (titulares) y **Archivo** (texto)

## Estructura

```
src/
  app/
    page.tsx              Ranking: cinta de resultados, podio y tabla
    cargar/               Carga de resultados (la pantalla principal de uso)
    historial/            Todos los partidos, agrupados por día
    jugadores/            Alta, edición, respaldo e importación
    jugador/[id]/         Perfil: ganados/perdidos, cara a cara y curva
    globals.css           Sistema visual completo (colores, tipografía, texturas)
  components/             UI: cada pieza visual de la app
  lib/
    types.ts              Modelo de datos
    elo.ts                Cálculo del puntaje
    liga.ts               Deriva tabla, rachas, cruces y estadísticas
    store.ts              Estado + persistencia en localStorage (y migración)
    motion.ts             Presets de animación
    demo.ts               Liga de ejemplo
```

## Ideas para más adelante

- Liga compartida en la nube (Supabase) para que cada uno la vea desde su teléfono.
- Dobles (2 vs 2).
- Torneos con llave de eliminación.
- Récords de la liga: mayor racha histórica, la remontada más grande, el clásico más jugado.
