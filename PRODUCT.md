# Mesa — contexto de producto

## Registro

`product` — la interfaz sirve a una tarea. Nadie entra a Mesa a mirarla: entra a anotar un punto,
ver quién va primero o revisar si le gana a alguien. La app tiene que desaparecer detrás de eso.

La excepción son dos momentos, que sí son escenográficos: el podio del ranking y la pantalla de
final de partido. Ahí el resultado es el producto.

## Usuarios

Un grupo chico de amigos o compañeros de trabajo con una mesa de ping pong. Entre 3 y 10 personas.
Ninguno es árbitro ni lleva planillas: quieren discutir quién es mejor con datos.

**Escena de uso:** un celular apoyado en el borde de la mesa, de noche, con luz artificial. Alguien
toca la pantalla con la mano transpirada entre punto y punto mientras el otro protesta. Nadie va a
leer instrucciones ni a completar un formulario de cinco campos parado al lado de la red.

De ahí salen tres decisiones: **pantalla oscura** (uso nocturno, contraste alto sin encandilar),
**blancos táctiles enormes** (media pantalla por jugador) y **cero fricción para guardar** (el
partido se guarda solo al terminar, con deshacer a un toque).

## Propósito

Convertir partidos sueltos en una liga: ranking, rachas, historial y cruces directos. El valor no
está en anotar el resultado, está en lo que ese resultado le hace a la tabla.

## Tono

Rioplatense, directo, sin solemnidad deportiva ni entusiasmo de app. "La mesa está vacía", "Su
bestia negra es Nacho", "Fede manda la mesa con 9 victorias al hilo". Nunca "¡Genial!" ni "¡Ups!".
La app comenta el juego como lo comentaría alguien parado al lado.

## Anti-referencias

- **Apps de fitness gamificadas.** Nada de medallas, insignias, niveles ni confeti. El ranking ya
  es la recompensa.
- **Dashboards deportivos de TV.** Nada de gradientes azul-violeta, glassmorphism ni tarjetas con
  ícono + título + descripción repetidas al infinito.
- **Estética "gamer".** Nada de negro puro con verde neón ni tipografías angulosas.
- **Marcadores de plástico.** Nada de skeuomorfismo de display de siete segmentos.

## Principios

1. **El número es el contenido.** Marcadores, puntajes y diferencias en monoespaciada tabular, con
   el peso visual que les corresponde. Nada de números chiquitos con etiquetas grandes.
2. **Todo se deriva de los partidos.** No se guarda ningún puntaje: se recalcula reproduciendo el
   historial. Borrar un partido cargado mal corrige la liga entera, sin estados inconsistentes.
3. **Sin cuentas ni servidor.** La liga vive en el navegador. El puente entre teléfonos es un
   archivo JSON que se descarga e importa, no un login.
4. **Nada de modales.** Confirmar, editar y elegir pasa en línea, donde está el control.
5. **La animación informa.** Reordenar la tabla, rodar un puntaje, marcar punto de partido. Si un
   movimiento no comunica un cambio de estado, no va.
