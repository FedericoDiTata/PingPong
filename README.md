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
para que las rachas y la curva de nivel digan algo real.

Con ese historial la tabla arranca así: **Ernes 58,0 · Fer 51,1 · Fede 47,8 · Chris 43,1**.

Desde ahí en adelante, todo lo que se anote se suma encima.

## Cómo se usa

1. **Anotá los resultados** en *Cargar*. Son tres toques:
   - tocás a los dos que jugaron,
   - tocás al que ganó,
   - guardás.
   Si se acuerdan del marcador, hay un paso opcional: se toca cuántos puntos hizo el que perdió
   (0 a 9) y listo. Para los partidos peleados hay un botón *Deuce* que deja escribir 12-10, 13-11
   o lo que haya salido.
2. **Mirá el ranking**. Cada resultado recalcula niveles, puestos y rachas.
3. **Sumá gente** cuando haga falta, en *Jugadores*. Los que entran arrancan en nivel 50.

En *Jugadores*, el lápiz de cada uno abre el editor para cambiarle el nombre o el emoji. Las fotos
de perfil no se tocan desde la app: son archivos del proyecto (ver más abajo).

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
- Mejor y peor racha, pico histórico de nivel y la curva de cómo viene fecha a fecha.

---

## Cómo funciona el nivel

Cada jugador tiene un **nivel de 0 a 100**: la probabilidad de ganarle a un jugador promedio. 50 es
el promedio exacto, así que arriba de 50 le ganás a la media y abajo no.

El método se llama **Bradley-Terry**. En vez de ir sumando y restando partido por partido, mira
todos los resultados juntos y busca el nivel de cada uno que mejor los explica. Tres consecuencias:

- **No importa el orden en que se cargan los partidos.** Esto es lo importante y es la razón de
  haber elegido este método: acá los resultados se anotan de memoria y en desorden, un rato después
  de jugarlos. Cargarlos en otro orden da exactamente el mismo resultado.
- **Importa contra quién ganaste.** Si A le gana seguido a B y B le gana seguido a C, entonces A
  queda bastante arriba de C aunque nunca hayan jugado entre ellos.
- **Jugar más no suma.** Lo que mueve el nivel es ganar más de lo que perdés, no la cantidad de
  partidos.

Todos entran con partidos virtuales contra un rival promedio (`PARTIDOS_DE_ARRANQUE` en
`src/lib/nivel.ts`). Sin eso, alguien con dos partidos y dos victorias daría 100 y se comería la
tabla; con eso hace falta ganar seguido y bastante para despegarse. El que todavía no jugó queda
justo en 50.

El nivel se muestra con un decimal a propósito: con cien partidos encima, un partido nuevo mueve
menos de un punto, y redondeado a entero no se vería nunca.

El nivel **no se guarda**: se recalcula desde los partidos cada vez que algo cambia. Por eso podés
borrar un partido mal cargado y toda la tabla se corrige sola.

> **Por qué no es un ELO.** La primera versión lo era, y estaba mal para este uso. El ELO calcula
> cada partido con los puntajes del momento, así que depende del orden. Se midió con los 105
> partidos reales de la liga: cargándolos en 2000 órdenes distintos, aparecían **las 24 tablas
> posibles**, y cualquiera de los cuatro podía terminar primero o último con los mismos resultados.
> Con Bradley-Terry, 2000 órdenes dan una sola tabla.

---

## Dónde viven los datos

Todo se guarda en el `localStorage` del navegador que usás. Ventajas: no hay que crear cuenta, anda
sin internet y nadie más ve tus datos. Contra: **la liga vive en ese navegador**. Si cada uno la
abre en su celular, cada uno arranca del mismo historial inicial pero después sigue por su cuenta.

> **Ojo con la dirección.** El navegador guarda por dirección exacta. Dos trampas concretas:
>
> - **En local, el puerto cuenta**: lo que cargues en `localhost:3000` no existe en
>   `localhost:3001`. Por eso `npm run dev` está fijado al 3000.
> - **En Vercel, las vistas previas no sirven**: cada push genera una URL nueva
>   (`ping-pong-abc123.vercel.app`), y para el navegador cada una es una app distinta y vacía.
>   Entrá siempre por la URL de producción, la que no cambia.
>
> La app avisa sola en los dos casos: si estás en una vista previa aparece un cartel con el link a
> la buena, y si arrancó sin datos guardados te lo dice en vez de disimularlo con la liga inicial.
> Abajo de todo en *Jugadores* siempre se ve en qué dirección está guardando.

Para moverla o compartirla, en *Jugadores → Los datos son tuyos*:

- **Descargar liga**: baja un `.json` con todo.
- **Importar archivo**: reemplaza los datos de este navegador con los de un archivo.

*Empezar de cero* borra todo, incluido el historial inicial, y no se vuelve a sembrar. Si querés
recuperarlo, importá un archivo o borrá la clave `mesa.liga.v1` del navegador.

Eso es lo que pasa **sin** Supabase configurado. Con la base conectada, la liga es una sola para
todos y el navegador queda sólo como copia local (ver más abajo).

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

**Usá siempre la URL de producción**, la que figura arriba de todo en el panel de Vercel y no
cambia nunca. Las direcciones que aparecen abajo de cada commit son vistas previas: sirven para
mirar un cambio antes de publicarlo, pero cada una tiene su propio almacenamiento vacío.

Una vez publicada, desde el celular se puede agregar a la pantalla de inicio y se abre como una app.

---

## Las fotos de perfil

Están en `public/jugadores/`, una por jugador, y se despliegan junto con la app. Eso las hace
inmunes al problema de siempre: no dependen del navegador, así que se ven igual en todos los
teléfonos, en todas las direcciones y sin importar cuántas veces se limpie el almacenamiento.

El precio es que no se cambian desde la app. Para agregar o reemplazar una:

1. Poner el archivo en `public/jugadores/` (cuadrado, 512 px va bien).
2. Agregar la línea correspondiente en [`src/lib/fotos.ts`](src/lib/fotos.ts), donde la clave es el
   **id** del jugador, no su nombre: así renombrar a alguien no le cambia la cara.

Quien no tenga foto muestra su emoji. Si el archivo no existe o está mal escrito, el avatar cae al
emoji también, sin romper nada.

## La liga compartida

Con Supabase configurado, la liga es una sola: quien carga un resultado desde el celular se lo
muestra a todos en el acto, sin recargar. Sin configurar, la app sigue andando con la liga guardada
en el navegador, así que una copia recién clonada funciona igual.

**No hay cuentas ni contraseñas.** La liga es de quien tenga el link, y cualquiera que entre puede
cargar y borrar partidos. Es a propósito: al lado de la mesa, con el celular en la mano, pedir un
login es garantía de que el partido no se anote. No pongas nada privado ahí adentro.

Para encenderla:

1. Correr [`supabase/schema.sql`](supabase/schema.sql) en el **SQL Editor** del proyecto. Crea las
   dos tablas con las reglas del juego como restricciones, abre los permisos y prende el tiempo
   real. Se puede correr más de una vez.
2. Cargar las dos variables de [`.env.example`](.env.example) en Vercel y volver a desplegar. Ojo
   con la URL: va el **Project URL** (`https://xxx.supabase.co`), no el endpoint REST que termina en
   `/rest/v1/`.

La primera vez que se abre en cada computadora aparece una pantalla que lo explica. Si ese navegador
tenía partidos que en la liga no están, ofrece sumarlos: nada se pisa ni se duplica, porque todo se
identifica por id.

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
    nivel.ts              Cálculo del nivel (Bradley-Terry)
    fotos.ts              Qué foto le toca a cada jugador
    liga.ts               Deriva tabla, rachas, cruces y estadísticas
    store.ts              Estado + persistencia en localStorage (y migración)
    motion.ts             Presets de animación
    inicial.ts            Plantel e historial con el que arranca la liga
```

## Ideas para más adelante

- Dobles (2 vs 2).
- Torneos con llave de eliminación.
- Récords de la liga: mayor racha histórica, la remontada más grande, el clásico más jugado.
