# Mesa · liga de ping pong

App web para llevar el registro de los partidos de ping pong entre amigos: **quién jugó contra
quién, quién ganó y cómo queda la tabla**. El marcador exacto es opcional, porque en la vida real
casi siempre queda "le ganó Fede" y nada más.

Todos los partidos son a **un game de 11**.

---

## Con qué arranca

La primera vez que se abre en un navegador, la app se siembra sola con el plantel y el historial
que ya se venía llevando de memoria (`src/lib/inicial.ts`):

| | Fede | Chris | Ernes | Fer |
|---|---|---|---|---|
| **Fede** | — | 6-4 | 1-6 | 11-10 |
| **Chris** | 4-6 | — | — | 10-13 |
| **Ernes** | 6-1 | — | — | 7-8 |
| **Fer** | 10-11 | 13-10 | 8-7 | — |

Son 76 partidos sin marcador (de esos sólo se sabía quién había ganado), repartidos entre febrero y
julio de 2026. Las victorias de cada cruce están intercaladas a lo largo de la serie y no apiladas,
para que las rachas y la curva de puntaje digan algo real.

Con ese historial la tabla arranca así: **Ernes 109 · Fer 70 · Fede 47 · Chris 25**.

Desde ahí en adelante, todo lo que se anote se suma encima.

## Cómo se usa

1. **Anotá los resultados** en *Cargar*. Son tres toques:
   - tocás a los dos que jugaron,
   - tocás al que ganó,
   - guardás.
   Si se acuerdan del marcador, hay un paso opcional: se toca cuántos puntos hizo el que perdió
   (0 a 9) y listo. Para los partidos peleados hay un botón *Deuce* que deja escribir 12-10, 13-11
   o lo que haya salido.
2. **Mirá el ranking**. Cada resultado recalcula puestos, rachas y puntaje.
3. **Sumá gente** cuando haga falta, en *Jugadores*. Los que entran arrancan con 50 puntos.

En *Jugadores*, el lápiz de cada uno abre el editor: se le puede cambiar el nombre, el emoji o
**subir una foto de perfil**. La foto se recorta en cuadrado y se achica a 256 px antes de
guardarse, así la liga entera sigue entrando cómoda en el navegador.

La pantalla de carga está pensada para descargar una tanda de partidos de una sentada: se guarda,
la pareja se limpia sola, y abajo queda la lista de lo recién cargado con un botón para deshacer si
te equivocaste.

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

Es un ELO (el sistema del ajedrez) con cuatro cambios pensados para una liga chica:

- **Todos arrancan con 50 y nadie puede quedar en negativo.** No se puede perder lo que no se
  tiene: el que llega a cero no baja más, sólo puede subir.
- **El factor K baja con la experiencia.** Los primeros 5 partidos mueven mucho (K=48), entre el 5
  y el 15 menos (K=32), después se estabiliza (K=24). El ranking se ordena rápido al principio y no
  lo da vuelta un partido suelto más adelante.
- **Una paliza vale un poco más**, pero sólo si cargaste el marcador. Si el partido se anotó sin
  puntos, cuenta como uno normal: nadie tiene que anotar el resultado exacto para que esto funcione.
- **Ganarle a alguien de arriba suma más**, y perder contra alguien de abajo cuesta más.

Lo que uno gana, el otro lo pierde. La única excepción es el piso: si el que perdió no tiene puntos
suficientes, el ganador igual se lleva los suyos. Por eso todos arrancan con 50 y no con 0, para que
haya colchón y eso casi no pase — con el historial de esta liga el piso se toca tres veces en 76
partidos, todas al principio. El número está en `PUNTOS_INICIAL` (`src/lib/elo.ts`) y se puede
cambiar sin romper nada: el puntaje **no se guarda**, se recalcula reproduciendo todos los partidos
en orden cada vez que algo cambia. Por eso también podés borrar un partido mal cargado y toda la
tabla se corrige sola.

---

## Dónde viven los datos

Todo se guarda en el `localStorage` del navegador que usás. Ventajas: no hay que crear cuenta, anda
sin internet y nadie más ve tus datos. Contra: **la liga vive en ese navegador**. Si cada uno la
abre en su celular, cada uno arranca del mismo historial inicial pero después sigue por su cuenta.

Para moverla o compartirla, en *Jugadores → Los datos son tuyos*:

- **Descargar liga**: baja un `.json` con todo.
- **Importar archivo**: reemplaza los datos de este navegador con los de un archivo.

*Empezar de cero* borra todo, incluido el historial inicial, y no se vuelve a sembrar. Si querés
recuperarlo, importá un archivo o borrá la clave `mesa.liga.v1` del navegador.

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
    page.tsx              Ranking: podio de cuatro y tabla de posiciones
    cargar/               Carga de resultados (la pantalla principal de uso)
    historial/            Todos los partidos, agrupados por día
    jugadores/            Alta, edición, respaldo e importación
    jugador/[id]/         Perfil: ganados/perdidos, cara a cara y curva
    globals.css           Sistema visual completo (colores, tipografía, texturas)
  components/             UI: cada pieza visual de la app
  lib/
    types.ts              Modelo de datos
    elo.ts                Cálculo del puntaje
    foto.ts               Recorte y compresión de las fotos de perfil
    liga.ts               Deriva tabla, rachas, cruces y estadísticas
    store.ts              Estado + persistencia en localStorage (y migración)
    motion.ts             Presets de animación
    inicial.ts            Plantel e historial con el que arranca la liga
```

## Ideas para más adelante

- Liga compartida en la nube (Supabase) para que cada uno la vea desde su teléfono.
- Dobles (2 vs 2).
- Torneos con llave de eliminación.
- Récords de la liga: mayor racha histórica, la remontada más grande, el clásico más jugado.
