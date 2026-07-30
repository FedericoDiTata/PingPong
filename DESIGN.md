# Mesa — sistema visual

Todos los tokens viven en `src/app/globals.css` dentro de `@theme`. Si algo no está ahí, no debería
estar hardcodeado en un componente.

## Idea rectora

**El cartel pintado a mano de un club de barrio.** Azul de mesa, naranja de pelota, papel crema,
bordes gruesos y sombras duras. Nada de degradados suaves, vidrios esmerilados ni superficies
pulidas: la app tiene que verse impresa, no renderizada.

Regla práctica: si un bloque no tiene borde de 3px y sombra dura, probablemente esté mal.

## Color

Dos colores mandan: **azul** (superficie) y **naranja** (todo lo que importa). El crema es el papel
y el tinta es la línea.

| Rol | Token | Valor |
|---|---|---|
| Fondo de página | `azul-900` | `oklch(0.275 0.125 263)` |
| Fondo profundo (barras, huecos) | `azul-950` | `oklch(0.205 0.095 265)` |
| Bloque azul | `azul-800` / `azul-700` | `oklch(0.34 0.145 261)` / `oklch(0.425 0.165 259)` |
| Acento | `naranja` | `oklch(0.725 0.2 47)` |
| Acento claro (hover) | `naranja-claro` | `oklch(0.84 0.148 66)` |
| Papel | `crema` | `oklch(0.955 0.03 84)` |
| Línea y texto sobre papel | `tinta` | `oklch(0.175 0.06 266)` |

Reglas:

- El naranja significa: victoria, jugador seleccionado, puesto 1, acción principal, día del
  historial. Nunca es decorativo.
- El azul es el que pierde y el que espera. El crema es el que informa.
- No hay verde ni rojo semánticos: ganar es naranja, perder es azul. La paleta se banca todo.

### Color por jugador

Cada jugador recibe un color y una **inclinación** estables derivados de su id
(`src/lib/color.ts`), de una lista curada de ocho tonos. La inclinación es la que hace que los
avatares parezcan calcomanías pegadas a mano y no una grilla perfecta.

## Tipografía

- **Anton** (`display`) para todo lo que grita: títulos, nombres, números, marcadores. Siempre en
  mayúsculas, `line-height 0.88`, tracking apretado.
- **Archivo** para lo que se lee: bajadas, textos, botones, etiquetas.

Escala grande a propósito: los títulos de página van en `text-4xl`/`text-5xl` (3.75–5rem) y los
marcadores del perfil en `text-5xl`. Un ranking que se lee desde el otro lado de la mesa.

**Rótulo** (`.rotulo`): Archivo 700, `2xs`, mayúsculas, `tracking 0.16em`. Es la letra chica de los
carteles. Cuando va sobre naranja y torcido, es una calcomanía.

## Forma y elevación

- Bordes: **3px** de `tinta`, siempre. 2px sólo en piezas chicas (fichas de forma, chips).
- Sombras duras, sin difuminar: `--golpe` (5px), `--golpe-chico` (3px), `--golpe-grande` (9px).
- Radios: `sm 5px` · `md 10px` · `lg 16px`.
- Los botones con sombra se **hunden** al apretarlos: `translate(4px, 4px)` y sombra a cero. Es un
  objeto físico, no un rectángulo que cambia de color.
- Deshabilitado no es "lo mismo más transparente": es un bloque `azul-950` sin sombra.

## Textura

- `.trama`: puntos de medio tono cada 9px sobre el fondo. Es lo que da el aire de impreso.
- `.grano`: ruido al 5% en `overlay` sobre la capa de fondo.

## Movimiento

Acá el rebote **es** el estilo. Los presets están en `src/lib/motion.ts`:

- `resorte` (stiffness 320 / damping 15): entradas de bloques, rebotan una vez.
- `resorteFirme` (420 / 30): reordenamientos y listas.
- `golpe` (700 / 20): lo que aparece de la nada y se planta (sellos, chips, confirmaciones).

Además:

- **Estallido de partículas** (`Explosion`) al guardar un resultado: 28 fichas con borde que salen
  radialmente y caen. Sin librería, con semilla determinística para no romper la pureza del render.
- **Podio de cuatro escalones** que crecen desde abajo con rebote.
- **Hamacado continuo** (`animate-tiembla`) en el cartel de "Rey de la mesa".
- **Respiración** del botón de guardar cuando ya se puede guardar.
- Hover de tarjetas: suben 3-4px y rotan medio grado.
- Escalonado con tope (`escalonar`) para que una lista larga no tarde una eternidad.

`<MotionConfig reducedMotion="user">` está en el layout raíz: quien tenga movimiento reducido
activado recibe los fundidos sin los desplazamientos, sin que ningún componente tenga que decidirlo
por su cuenta. Por eso podemos exagerar sin culpa.

## Prohibido

- Degradados de fondo suaves, glassmorphism, sombras difuminadas de colores.
- Bordes finos de 1px.
- Texto gris sobre gris.
- Tipografía chica para datos importantes.
- Modales: confirmar y editar pasa en línea, donde está el control.
