# Mesa — sistema de diseño

Todos los tokens viven en `src/app/globals.css` dentro de `@theme`. Si algo no está acá, no
debería estar hardcodeado en un componente.

## Idea rectora

La referencia material es la mesa reglamentaria: **azul profundo**, **líneas de tiza blancas**, la
red, y la **pelota de celuloide naranja** como único acento. No es un tema "deportivo" genérico;
es un objeto concreto mirado desde arriba, con una luz cenital encima.

## Color

Estrategia: **comprometida**. Un solo color saturado (el azul de la mesa) sostiene toda la
superficie; el naranja aparece en menos del 10% y siempre significa algo.

| Rol | Token | Valor |
|---|---|---|
| Fondo de página | `mesa-950` | `oklch(0.145 0.028 252)` |
| Panel | `mesa-900` | `oklch(0.185 0.036 251)` |
| Panel elevado / campo | `mesa-850` | `oklch(0.212 0.038 251)` |
| Superficie interactiva | `mesa-800` | `oklch(0.245 0.038 250)` |
| Texto principal | `tiza` | `oklch(0.965 0.006 250)` |
| Texto secundario | `tiza-70` | `oklch(0.775 0.014 250)` |
| Texto terciario | `tiza-45` | `oklch(0.625 0.018 250)` |
| Texto mínimo (hints, unidades) | `tiza-25` | `oklch(0.555 0.02 250)` |
| Acento | `pelota` | `oklch(0.785 0.166 62)` |
| Victoria | `gana` | `oklch(0.805 0.135 158)` |
| Derrota | `pierde` | `oklch(0.665 0.163 24)` |

Reglas:

- Nunca `#000` ni `#fff`. Todos los neutros están teñidos hacia el azul de la mesa.
- El naranja es para: acción primaria, jugador en primer puesto, saque, punto de game y marcador
  del ganador. Nunca decorativo.
- Verde y rojo son semánticos y van en dosis chicas (barras de forma, variación de puntaje). Nunca
  como fondo de bloque.

### Color por jugador

Cada jugador recibe un tono estable derivado del hash de su id, tomado de una lista curada de 8
matices que conviven con el azul (`src/lib/color.ts`). Se usa en avatares, en la barra de fuerza
del ranking, en la curva de puntaje y en el fondo de cada mitad del partido en vivo. Es un sistema
categórico, como una paleta de gráficos: **nunca** HSL al azar.

## Tipografía

- **Instrument Sans** para todo lo que se lee: títulos, nombres, textos, botones.
- **Geist Mono** para todo lo que se cuenta: puntajes, marcadores, fechas cortas, etiquetas.

La monoespaciada no es un guiño técnico: los números tabulares no bailan cuando cambian, y en una
app que es básicamente un marcador eso importa.

Escala fija (no fluida), razón ~1.2: `2xs 0.6875` · `xs 0.75` · `sm 0.8125` · `base 0.9375` ·
`lg 1.0625` · `xl 1.3125` · `2xl 1.625` · `3xl 2.125` · `4xl 2.75`.

Los marcadores en vivo son la única excepción fluida: `clamp(4.5rem, 23vw, 10rem)`.

**Etiqueta** (`.etiqueta`): mono, `2xs`, mayúsculas, `tracking 0.14em`, `tiza-45`. Es el patrón
para todo encabezado de sección y de dato. Aparece siempre arriba del título, nunca sola.

## Forma y elevación

Radios: `xs 4px` · `sm 7px` · `md 11px` · `lg 16px` · `xl 22px`. Escala corta a propósito.

Sobre fondo oscuro la sombra casi no se ve, así que la elevación se construye con un **realce
interno** (`inset 0 1px 0` de tiza al 7%) que simula la luz cenital, más un borde de 1px al 9%.
Eso es la utilidad `.panel`.

El grano (`.grano`) va sobre la capa de fondo fija, al 2.8% en `overlay`. Es lo que evita que los
gradientes se vean como plástico digital.

## Movimiento

Duraciones: **120ms** feedback (hover, press) · **200ms** cambio de estado · **300-320ms** entrada
de elementos · **550-900ms** sólo para la construcción del podio y el trazado de la curva.

Curvas: `--ease-quart (0.25, 1, 0.5, 1)` por defecto, `--ease-expo (0.16, 1, 0.3, 1)` para
entradas. **Sin rebote ni elástica.** Los objetos reales desaceleran, no rebotan.

Sólo se anima `transform` y `opacity`. Los reordenamientos de tabla usan `layout` de Motion con
spring `stiffness 420 / damping 42`.

`<MotionConfig reducedMotion="user">` está en el layout raíz: quien tenga movimiento reducido
activado recibe los fundidos sin los desplazamientos, sin que ningún componente tenga que
decidirlo por su cuenta.

## Componentes

- **Botón** (`Boton`): `primario` (naranja lleno), `secundario` (superficie), `fantasma` (texto),
  `peligro` (rojo). Deshabilitado ≠ el mismo color más apagado: el primario pasa a superficie
  neutra, porque un control inerte tiene que parecer inerte.
- **Confirmación en línea** (`ConfirmarEnLinea`): el control se convierte en la pregunta. No hay
  modales en toda la app.
- **Estado vacío** (`EstadoVacio`): título, explicación de una línea de qué gana el usuario si
  actúa, y una o dos acciones. Enseña la interfaz, no dice "no hay nada".
- **Odómetro** (`NumeroRodante`): sólo donde el número es la información (puntaje, marcador).

## Prohibido

- Bordes laterales de color como acento.
- Texto con gradiente.
- Glassmorphism decorativo (el `backdrop-blur` sólo va en las barras de navegación, que sí se
  superponen a contenido).
- Grillas de tarjetas idénticas con ícono + título + descripción.
- Modales para tareas simples.
- Rayas de neón, sombras de colores, brillos "gamer".
