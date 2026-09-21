# Beat Pulse

Simulador de electrocardiograma para estudiantes de enfermería y medicina que están
aprendiendo a distinguir ritmos. Eliges un ritmo y el trazo, el corazón y la respiración
responden en tiempo real, o te pones a prueba con casos al azar en el modo examen.

**Demo:** https://beat-pulse-visualizer.vercel.app/

## Por qué el trazo es fiel

**El complejo P-QRS-T conserva sus tiempos clínicos a cualquier frecuencia.** El intervalo
PR mide 160 ms y el QRS 90 ms lo mismo en una bradicardia de 45 lpm que en una taquicardia
de 180, porque en un corazón real lo que se acorta al acelerar es el silencio entre latidos
y no el latido. Es lo que separa a este simulador de las animaciones de ECG que estiran el
complejo entero con la frecuencia: a un ojo entrenado esas se delatan enseguida, porque un
QRS de 120 ms en bradicardia ya sería un bloqueo de rama y no una bradicardia sinusal. Lo
único que sí sigue a la frecuencia es la repolarización, y lo hace según la fórmula de
Bazett, igual que en la vida real.

**La onda sale idéntica en un monitor de 30 Hz y en uno de 144 Hz.** El tiempo real que
entrega el navegador se acumula y se consume en pasos fijos de 1/250 de segundo, así que la
señal no depende de a cuántos cuadros por segundo vaya la pantalla; lo único que cambia es
cada cuánto se redibuja.

Las dos cosas están sujetas por **127 pruebas** que se ejecutan con `npm test`, entre ellas
una que mide el ancho del QRS a 30, 45, 60, 75, 100, 120, 150 y 200 lpm y comprueba que no
varía, y otra que simula 15 y 144 cuadros por segundo y verifica que la onda R sobrevive
igual en los dos casos.

## Qué hace

Un trazo de ECG dibujado de forma continua sobre `<canvas>`, siete ritmos con sus firmas
reales, un deslizador de frecuencia de 30 a 200 lpm, una explicación de cada ritmo, y
animaciones de corazón y pulmones sincronizadas. Incluye modo claro y oscuro.

Los ritmos: sinusal normal, bradicardia, taquicardia, arritmia sinusal, fibrilación
auricular (sin ondas P, intervalos caóticos y línea de base temblando), extrasístole
ventricular (complejo ancho y pausa compensadora) y bloqueo AV de 2.º grado Mobitz I (el PR
se alarga hasta que un latido no conduce y se ve la P sola).

En el **modo examen** la app sortea un ritmo y lo esconde, y los siete botones pasan a ser
las respuestas. Al elegir se revela cuál era, aparece su explicación y el marcador lleva la
cuenta de aciertos y de la racha de seguidas. La frecuencia se sortea dentro del rango
plausible del ritmo y se sigue mostrando, porque en bradicardia y taquicardia forma parte
del diagnóstico.

Lo laborioso del examen fue tapar por dónde se escapaba la respuesta sin haber leído la
onda, que resultaron ser cinco sitios: el nombre del ritmo junto al título, el color del
trazo, porque cada ritmo tiene el suyo, el deslizador de frecuencia, porque poder moverla
rompe el ejercicio, el sufijo «irregular» de la etiqueta de frecuencia, que por sí solo
reducía siete opciones a cuatro, y el resumen impreso debajo de cada botón, que es el
criterio diagnóstico y convertía dos casos en una comparación de números: leer 54 BPM y
elegir el que dice «lento, menos de 60 lpm» no es leer un electrocardiograma. Todo eso
vuelve al revelar, que es cuando enseña.

En el **modo explorar** se puede arrastrar sobre el trazo para poner dos marcas y leer los
milisegundos que hay entre ellas, con su equivalencia en latidos por minuto, como quien mide
sobre el papel.

El trazo va sobre papel de electro de verdad: cuadro chico de 0,04 s por 0,1 mV y cada
quinta línea marcada. Se pueden oír los latidos: bip agudo el normal, grave el ventricular,
y silencio el que no conduce. Al mover la frecuencia la etiqueta del ritmo cambia sola en la
frontera de los 60 y los 100 lpm, y ni eso ni cambiar de ritmo borran el trazo, así que la
transición se ve ocurrir. Sólo el botón Reiniciar limpia.

El diagrama del corazón no es decorativo: las aurículas se contraen en la onda P y los
ventrículos tras el intervalo PR, así que en el bloqueo AV se ve a las aurículas contraerse
y al ventrículo no responder, y en la extrasístole el ventrículo se adelanta sin aurícula
previa.

## Cómo levantarlo

```bash
npm install
npm run dev
```

Abre <http://localhost:8080>.

Otros comandos:

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción para comprobarlo |
| `npm test` | Las 127 pruebas de la lógica de la señal y del examen |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript en modo estricto |

## Cómo funciona

El núcleo no depende de React ni del DOM, así que se puede probar directamente:

- **`src/lib/rhythms.ts`** — única fuente de verdad. Cada ritmo declara un `bpm` y de ahí
  salen la duración del latido, la frecuencia que se muestra, la contracción del corazón y
  la frecuencia respiratoria.
- **`src/lib/ecgWaveform.ts`** — el complejo P-QRS-T como suma de gaussianas sobre el tiempo
  absoluto desde el inicio del latido, con anclas fisiológicas: PR de 160 ms y QRS de 90 ms,
  iguales a cualquier frecuencia. Lo que se acorta al acelerar es el silencio entre latidos,
  no el latido. Sólo la repolarización sigue a la frecuencia, según Bazett. Recibe la
  morfología de un latido (si hay P, si conduce, el PR, el ancho y la polaridad del QRS) y
  la dibuja, sin saber nada de ritmos.
- **`src/lib/beats.ts`** — un generador de latidos por familia. Es lo que distingue una
  arritmia de otra: la fibrilación quita las P y hace los intervalos caóticos, la
  extrasístole ensancha el complejo y añade la pausa, el Mobitz I alarga el PR hasta que uno
  cae. Funciones puras del índice del latido, así que son aleatorias pero reproducibles.
- **`src/lib/ecgEngine.ts`** — búfer circular con la ventana visible. El tiempo real que
  entrega `requestAnimationFrame` se consume en pasos **fijos** de 1/250 s, de modo que la
  onda es idéntica a 30 Hz que a 144 Hz.
- **`src/lib/examen.ts`** — el modo examen: elegir el caso a partir de una semilla, sortear
  la frecuencia dentro del rango del ritmo y calificar la respuesta. Puro y reproducible,
  igual que los generadores de latidos.
- **`src/lib/pulse.ts`** — el latido con identidad propia, para que el diagrama reaccione a
  cada uno aunque dos seguidos sean iguales.
- **`src/lib/heartSound.ts`** — un bip por latido con Web Audio, sin librerías. El
  `AudioContext` se crea sólo desde un gesto del usuario, porque los navegadores bloquean el
  audio que arranca solo. Apagado por defecto.
- **`src/lib/ecgGrid.ts`** — geometría del papel de electro. Aparte del lienzo porque es
  aritmética pura: en una ventana de 6 s los cuadros de 0,04 s son 150 columnas, que en un
  móvil caen por debajo de 3 px, así que ahí la rejilla menor se retira y quedan sólo las
  líneas marcadas.
- **`src/components/ecg/ECGCanvas.tsx`** — dibuja sobre `<canvas>` fuera del ciclo de render
  de React: la señal avanza sin re-renderizar el árbol de componentes.

## Stack

React · TypeScript · Vite · Tailwind CSS · shadcn/ui · Vitest

## Nota

Visualización educativa. No es un dispositivo médico y no lee ninguna señal real de ningún
paciente.
