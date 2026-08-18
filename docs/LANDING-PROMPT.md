# Landing prompt — AI Media Generator

Este archivo se le entrega a un agente para que construya la landing page del
proyecto. Está escrito como el resto de `docs/`: todo lo que el agente
adivinaría está escrito aquí, y solo eso.

Los hechos vienen de este repositorio. Las decisiones de estructura vienen de
lo que funciona en páginas de producto técnico — ver §12, *Fuentes*.

---

## 0. Cómo ejecutar este prompt

Antes de escribir una línea, carga estas skills en este orden:

1. `frontend-design` — dirección visual, para que la página no parezca plantilla.
2. `ui-ux-pro-max` — paletas, pares tipográficos, presets de motion, patrones
   por tipo de producto.
3. `impeccable` — pasada final de jerarquía, accesibilidad, estados y copy.
4. `artifact-design` — **solo** si vas a publicar la página como Artifact.

Si hay un MCP de Higgsfield disponible, úsalo para generar los assets del héroe
(§10). Si no lo hay, usa la app real. Nunca stock.

Trabaja en este orden: §1 verdad → §5 estructura → §8 copy → §4 diseño →
§6 momento firma → §11 checklist. La página no está lista hasta que §11 pase
entera.

---

## 1. La verdad del proyecto

Todo dato que aparezca en la página sale de aquí. **Si un número no está en el
repositorio, no va en la página.**

**El producto.** Una app donde el usuario inicia sesión, toma una foto, la IA la
convierte en una imagen, y esa imagen se vuelve un video corto que puede
descargar o compartir. Cinco pantallas: landing, sign-in, capture, result,
dashboard. Cinco rutas de API. Un dueño con un dashboard: un interruptor que
apaga toda la generación, un selector de calidad de video, tres contadores y un
gasto estimado.

**La app en vivo:** <https://ia-generator-openspec.vercel.app/> — destino de
todos los CTA primarios.

**El repositorio:** <https://github.com/sjunka/speckit-ai-generator>

**Cómo se construyó.** Con GitHub Spec Kit. Nadie escribió el código de la
aplicación: está descrito en `specs/001-ai-media-generator/` y el agente lo
construye. Cuatro personas, 39 tickets, 5 fases. La fase 1 la corre una persona
en `main`; cuando está arriba, las fases 2, 3 y 4 corren **al mismo tiempo** en
tres ramas; la fase 5 hace el merge y cierra.

**Por qué el paralelo funciona** — este es el punto técnico de la página, no un
adorno: cada fase declara de qué archivos es dueña (`Owns`) y cuáles no toca
(`Never touches`). Ningún archivo aparece en dos listas, así que dos personas
nunca editan lo mismo. Lo que una fase necesita de otra lo usa por la firma
acordada en *Contracts* y lo reemplaza por un doble hasta que la otra rama
llega. Por eso nadie espera a nadie.

**Números que puedes usar, y su fuente:**

| Número | Qué es | Dónde vive |
|---|---|---|
| 39 | tickets | `README.md`, `specs/001-ai-media-generator/tasks.md` |
| 5 | fases | mismo |
| 4 | personas trabajando en paralelo | `README.md` |
| 3 | ramas simultáneas | `README.md` |
| 80 | archivos de código en el resultado | `docs/REPLICATION-PROMPT.md` §0 |
| 5 | pantallas · 5 rutas de API | `docs/REPLICATION-PROMPT.md` §1 |

**Cómo decir el número que más importa, sin mentir:** «ningún archivo de la
aplicación se escribió a mano». No digas «cero líneas de código escritas por
humanos» — las especificaciones sí se escribieron a mano, y esa es justamente
la tesis.

**Prohibido inventar:** usuarios, descargas, clientes, estrellas de GitHub de
este repo, testimonios, logos de empresas, «confían en nosotros». Si no existe,
la sección no existe. La credibilidad de esta página son los artefactos: el
repo, la spec, los 39 tickets y la app funcionando.

**Sí puedes citar, con enlace:** GitHub Spec Kit es un proyecto open source de
GitHub (MIT) para spec-driven development, con el flujo
`specify → plan → tasks → implement`. Es de GitHub, no de este equipo — dilo así.

---

## 2. Audiencia y objetivo

Dos personas llegan a esta página, y la página tiene que servir a las dos sin
partirse en dos:

- **La que quiere probar la app.** Le importa qué hace y en cuánto tiempo.
  Su acción es el botón del héroe. La atendemos en los primeros 3 segundos.
- **La que evalúa el método.** Desarrollador, líder técnico, alguien del
  público de la presentación. Le importa si el paralelo es real o es un truco
  de demo. Su acción es el repo, la spec y el prompt de replicación. La
  atendemos de la mitad de la página hacia abajo.

**Objetivo primario:** clic en «Probar la app».
**Objetivo secundario:** clic al repositorio o a `tasks.md`.

Orden no negociable: **primero el producto, después el método.** Una página que
abre explicando su propio proceso de desarrollo pierde a la primera persona
antes del segundo scroll.

---

## 3. Stack y límites duros

| Cosa | Elección |
|---|---|
| Entrega | **Un solo archivo** `landing/index.html`, autocontenido |
| CSS | En el `<head>`, escrito a mano. Sin Tailwind, sin framework, sin build |
| JS | Inline, sin dependencias, sin bundler. Presupuesto: **< 8KB** sin comprimir |
| Motion | CSS nativo: `animation-timeline: view()`, `@starting-style`, transiciones. JS solo para la secuencia del héroe |
| Fuentes | Inter y JetBrains Mono desde Google Fonts, con `font-display: swap` y stack de respaldo real |
| Assets | `<video>` y `<img>` locales junto al HTML, o data URI si publicas como Artifact |
| Deploy | Estático. Vercel, GitHub Pages o Artifact — da igual, no debe requerir servidor |

**Sin GSAP, sin Lenis, sin Framer Motion, sin Locomotive Scroll, sin AOS, sin
librería de iconos.** Todo lo que esas librerías hacen aquí lo hace CSS en 2026.
Una landing que carga 200KB de JS para animar cuatro reveals se ve cara en el
navegador de quien la construyó y lenta en el celular de quien la ve.

**Presupuesto de rendimiento, medible:**

- LCP < 1.2s en 4G simulado.
- CLS = 0. Toda imagen y todo video llevan `width` y `height`.
- Peso total de la primera vista < 500KB, video del héroe incluido.
- Lighthouse ≥ 95 en Performance, Accessibility, Best Practices y SEO.
- La página funciona con JavaScript deshabilitado: se ve completa y todos los
  enlaces sirven. Lo único que se pierde es la secuencia animada del héroe, que
  degrada a la imagen final.

**No toques `app/page.jsx`.** La landing de la app está pinneada por tests que
afirman sus strings exactos (`"Create videos from photos"`, `"Start creating"`).
Esta página es un archivo aparte y no comparte ruta con la app.

---

## 4. Sistema de diseño

La landing y la app tienen que sentirse el mismo producto. Los tokens salen
verbatim de `app/globals.css` — no los reinterpretes, no los "mejores":

```css
--color-canvas: #010102;
--color-surface-1: #0f1011;
--color-surface-2: #141516;
--color-surface-3: #18191a;
--color-surface-4: #191a1b;
--color-hairline: #23252a;
--color-hairline-strong: #34343a;
--color-ink: #f7f8f8;
--color-ink-muted: #d0d6e0;
--color-ink-subtle: #8a8f98;
--color-ink-tertiary: #62666d;
--color-primary: #5e6ad2;
--color-primary-light: #828fff;
--color-primary-hover: #828fff;
--color-primary-focus: #5e69d1;
--color-success: #27a644;
```

Escala tipográfica, igual que en la app. Inter en todo menos `.mono`:

| Clase | Tamaño | Peso | Interlínea | Tracking |
|---|---|---|---|---|
| `.display-xl` | 80px | 600 | 1.1 | -3px |
| `.display-lg` | 56px | 600 | 1.1 | -2.4px |
| `.display-md` | 40px | 600 | 1.1 | -1.8px |
| `.display-sm` | 28px | 600 | 1.2 | -0.6px |
| `.heading-xl` | 24px | 600 | 1.2 | -0.2px |
| `.heading` | 20px | 600 | 1.3 | — |
| `.body` | 16px | 400 | 1.5 | — |
| `.body-sm` | 14px | 400 | 1.5 | — |
| `.caption` | 12px | 400 | 1.4 | — |
| `.eyebrow` | 13px | 500 | 1.2 | +0.4px, mayúsculas |
| `.mono` | — | 400 | 1.5 | JetBrains Mono |

En móvil, `display-xl` baja a 44px y `display-lg` a 34px. Usa `clamp()` una sola
vez por clase; no inventes tamaños intermedios.

**Reglas del sistema, y por qué:**

- **Modo oscuro únicamente.** No hay toggle, no hay variante clara. Los tokens
  son el tema.
- **La jerarquía sale de la escalera de superficies y de bordes hairline de
  1px.** Sin sombras, sin gradientes de relleno. Un `surface-2` sobre `canvas`
  con `1px solid var(--color-hairline)` es la tarjeta de esta casa.
- **El lavanda `#5e6ad2` es escaso a propósito.** Aparece en el CTA primario,
  en el foco y en un acento por sección como mucho. Una página donde el color de
  marca está en doce sitios no tiene color de marca.
- **Verde `#27a644`** es el único otro valor cromático, y solo para estado
  «listo».
- **Foco visible siempre:** `outline: 2px solid var(--color-primary); outline-offset: 2px`.
  No lo quites en ningún elemento interactivo.
- **Alturas:** todo control mínimo 44px. Radio 8px en controles y tarjetas, 4px
  en badges. **Nunca una píldora.**
- **Ancho máximo del contenido:** 1120px, centrado, con 24px de padding lateral
  en móvil.
- **Rejilla base de 8px.** Espaciado vertical entre secciones: 96px en móvil,
  144px en escritorio. La generosidad del espacio es la mitad de la sensación de
  producto caro.

**El detalle de contraste que casi todos fallan:** `--color-ink-tertiary`
(`#62666d`) sobre el canvas da alrededor de 3.5:1. **No lo uses para texto de
párrafo** — solo para texto grande, separadores o elementos no textuales.
`--color-ink-subtle` (`#8a8f98`) da alrededor de 6.3:1 y sí sirve para texto
secundario. Mide, no confíes en el ojo.

**Una licencia, y una sola:** la app prohíbe gradientes. La landing puede usar
**un** resplandor radial muy tenue detrás del héroe — lavanda al 6% de opacidad
como máximo, sin bordes visibles, invisible en un monitor mal calibrado. Si al
mirarlo piensas «hay un gradiente ahí», está mal hecho. Ningún otro gradiente en
toda la página.

---

## 5. Estructura de la página

Ocho bloques, en este orden. Sin menú de navegación completo: una barra superior
delgada con el nombre, un enlace a GitHub y el CTA. Los menús de navegación en
landings de conversión cuestan entre 10% y 15% de conversión, y esta página no
tiene otras páginas a las que ir.

### 1 — Héroe

Centrado, contenedor con ancho máximo. Ocupa la primera pantalla completa en
escritorio, pero **el CTA tiene que ser visible sin scroll también en un
iPhone de 360×640**. Contiene, en este orden: eyebrow, titular, subtítulo, dos
botones, micro-copy, y debajo la secuencia visual del §6.

El elemento visual del héroe **es el producto funcionando**, no una ilustración
abstracta. Tres estados reales: la foto, la imagen generada, el video.

### 2 — Franja de números

Inmediatamente después del héroe, sin respiro. Cinco cifras en una fila
(escritorio) o una rejilla 2+2+1 (móvil), sobre `surface-1`, separadas por
hairlines verticales. Cada cifra en `.display-md`, su etiqueta en `.caption`
con `--color-ink-subtle`.

Debajo de la franja, una línea en `.caption`: **«Números del repositorio, no de
marketing.»** Esa línea hace más por la credibilidad que cualquier logo.

### 3 — Cómo funciona

Tres pasos, formato *step-by-step*, no rejilla de tarjetas. Cada paso: número en
`.mono`, título en `.heading`, una frase en `.body-sm`, y la captura real de esa
pantalla de la app. En escritorio se leen en horizontal con una línea hairline
que los conecta; en móvil se apilan y la línea se vuelve vertical.

### 4 — El método

Aquí gira la página del producto al proceso. Encabezado en `.display-md`.
Arranca por el problema, no por la función: qué pasa normalmente cuando cuatro
personas y sus agentes tocan el mismo repositorio.

Debajo, el bloque de código con el flujo real, en `.mono` sobre `surface-2`:

```
/speckit-specify   →  spec.md
/speckit-plan      →  plan.md
/speckit-tasks     →  tasks.md    39 tickets, 5 fases
/speckit-implement →  el código
```

Y a la derecha (o debajo, en móvil), el fragmento que prueba la tesis: un
extracto real de `tasks.md` con sus bloques `Owns` / `Never touches`. Extráelo
del archivo, no lo inventes.

### 5 — El paralelo

El diagrama de las cuatro personas y las cinco fases. Una fase 1 en `main`, tres
carriles simultáneos, un merge, una fase 5. SVG inline, dibujado a mano con los
tokens, **no** una imagen exportada ni una librería de diagramas.

Cada carril lleva el nombre de la persona, el número de fase y su rama en
`.mono`. Al pasar el cursor por un carril, ese carril sube a `--color-ink` y los
otros bajan a `--color-ink-tertiary`. En táctil, sin hover: todos legibles
siempre. El diagrama no depende de JavaScript.

Bajo el diagrama, la frase que resume el mecanismo — está en §8, y es la única
frase de la página que puede pasar de tres líneas.

### 6 — Los cuatro tickets que deciden

Cuatro tarjetas sobre `surface-1`, código de ticket en `.mono`, una frase cada
una. Esta sección existe porque demuestra criterio de ingeniería, que es lo que
convence a la segunda audiencia:

- **T008** — el backend y la base de datos falsos. Hacen posible el trabajo en
  paralelo.
- **T030** — las cuentas reales y las llaves.
- **T032** — comprueba que el backend falso y el real coinciden. Atrapa el error
  que las pruebas no ven.
- **T037** — recorrer la app a mano en un celular. La demo.

### 7 — Preguntas

Acordeón nativo: `<details>` y `<summary>`. Sin JavaScript. Cuatro preguntas,
las respuestas están en §8.

### 8 — Cierre y pie

Bloque de cierre con fondo propio (`surface-2`, hairline arriba y abajo), un
titular corto, un botón. Nada más — sin formulario, sin newsletter, sin segundo
enlace compitiendo.

El pie lleva: repositorio, `spec.md`, `tasks.md`, la guía en PDF,
`REPLICATION-PROMPT.md`, y los cuatro nombres del equipo. En `.body-sm` con
`--color-ink-subtle`.

---

## 6. El momento firma

**Uno. No dos, no cinco.** Lo que separa una landing de diez mil dólares de una
de plantilla no es la cantidad de animación: es que haya exactamente un momento
memorable y que todo lo demás esté quieto y bien medido.

El momento de esta página es **la tubería del héroe**: la foto se convierte en
imagen generada, y la imagen se convierte en video, con los tres estados reales
del producto.

Cómo se comporta:

- Al cargar, se ve la foto original con un `StatusBadge` en estado pendiente y
  el texto `Generando... 4s` contando en `.mono` — el mismo contador que la app
  real muestra.
- La imagen generada entra con un cruce de opacidad de 600ms y `ease-out`. El
  badge pasa a verde `#27a644`. **La transición nunca mueve el layout.**
- Dos segundos después el marco se convierte en el `<video>`, en reproducción,
  `muted playsinline loop`.
- El ciclo se detiene ahí. No vuelve a empezar en bucle: un héroe que se repite
  cada seis segundos es un anuncio, y compite con el texto que la persona está
  leyendo.
- Un botón de texto discreto, «Ver de nuevo», reinicia la secuencia para quien
  llegó tarde.
- Con `prefers-reduced-motion: reduce`, no hay secuencia: se muestra el estado
  final — la imagen generada y el video con controles visibles — y el botón
  «Ver de nuevo» sigue funcionando si la persona lo pide.
- Con JavaScript deshabilitado, se muestra el estado final. La página no queda
  con un hueco.

Ese JS son unas veinte líneas: un par de `setTimeout` y dos cambios de clase.
Si estás escribiendo una máquina de estados para esto, te pasaste.

---

## 7. Motion

- **Todo el motion fuera del héroe es entrada, y es una sola:** opacidad de 0 a
  1 y `translateY(12px)` a `0`, 400ms, `cubic-bezier(0.16, 1, 0.3, 1)`, disparada
  al entrar en viewport con `animation-timeline: view()`. Sin `IntersectionObserver`.
- **Nada se mueve en paralaje.** Nada rota. Nada rebota. Nada aparece letra por
  letra.
- **Escalonado máximo:** 60ms entre elementos hermanos, hasta cuatro. Al quinto
  ya es una cortina y se ve barato.
- **Hover:** 120ms, solo color o borde. Sin `transform: scale` en tarjetas.
- Un bloque `@media (prefers-reduced-motion: reduce)` al final del CSS pone
  `animation: none` y `transition: none` en todo. Es la última regla de la hoja
  y no admite excepciones.

---

## 8. Copy deck

Español, en la voz del `README.md`: frases cortas, sujeto y verbo, sin adjetivos
de venta. Estos strings son el contrato — cámbialos solo si algo es factualmente
falso.

**Barra superior**
- Marca: `AI Media Generator`
- Enlaces: `GitHub` · botón `Probar la app`

**Héroe**
- Eyebrow: `Especificación primero. Código después.`
- Titular: `Una foto entra. Un video sale.`
- Subtítulo: `Tomas la foto, la IA la convierte en imagen, y esa imagen se vuelve un video corto que puedes descargar o compartir.`
- Botón primario: `Probar la app` → <https://ia-generator-openspec.vercel.app/>
- Botón secundario (tertiary, sin relleno): `Ver cómo se construyó` → `#metodo`
- Micro-copy bajo los botones, en `.caption`: `Sin instalar nada. Se usa desde el celular.`
- Variante en inglés del titular, si la página se traduce: `One photo in. One video out.`

**Franja de números**
- `39` / `tickets`
- `5` / `fases`
- `4` / `personas en paralelo`
- `80` / `archivos de código`
- `0` / `archivos escritos a mano`
- Pie de franja: `Números del repositorio, no de marketing.`

**Cómo funciona**
- Encabezado: `Tres pasos, sin curva de aprendizaje.`
- `01 · Tomas la foto` — `Se abre la cámara trasera. Eliges el ánimo del resultado en una lista.`
- `02 · La IA hace la imagen` — `Tu foto entra como referencia, no como descripción. El resultado se parece a lo que fotografiaste.`
- `03 · La imagen se vuelve video` — `Un movimiento de cámara suave. Cuando está listo, lo descargas o lo compartes.`

**El método**
- Eyebrow: `El método`
- Encabezado: `La especificación es el código fuente.`
- Párrafo: `Cuatro personas y sus agentes en el mismo repositorio terminan pisándose: dos ramas editan el mismo archivo y el merge decide quién pierde su trabajo. Aquí eso no pasa, y no es por disciplina.`
- Párrafo: `El código de la aplicación no se escribió a mano. Está descrito en spec.md, repartido en 39 tickets, y el agente lo construye ticket por ticket.`
- Enlace: `Leer la especificación` → `specs/001-ai-media-generator/spec.md`

**El paralelo**
- Encabezado: `Tres ramas al mismo tiempo, cero conflictos.`
- Frase del mecanismo: `Cada fase declara de qué archivos es dueña y cuáles no toca. Ningún archivo aparece en dos listas, así que dos personas nunca editan lo mismo. Lo que una fase necesita de otra lo usa por la firma acordada y lo reemplaza por un doble hasta que la otra rama llega — por eso nadie espera a nadie.`

**Los cuatro tickets**
- Encabezado: `Cuatro tickets deciden si esto funciona.`
- `T008` — `El backend y la base de datos falsos. Sin ellos, nadie puede trabajar en paralelo.`
- `T030` — `Las cuentas reales y las llaves de verdad.`
- `T032` — `Comprueba que el backend falso y el real coinciden. Atrapa el error que las pruebas no ven.`
- `T037` — `Recorrer la app a mano, en un celular. Ninguna prueba reemplaza esto.`

**Preguntas**
- `¿De verdad nadie escribió el código?` — `Nadie escribió el código de la aplicación. Las especificaciones sí se escribieron a mano, y ahí está el trabajo: decidir el contrato, los estados y los límites. El agente escribe los archivos.`
- `¿Y si el agente se equivoca?` — `Cada ticket lleva su prueba, y la prueba se escribe antes que el código. La fase 5 corre lint, pruebas y build sobre el merge de las tres ramas, y un ticket compara el resultado contra el original.`
- `¿Esto se puede repetir en otro proyecto?` — `Sí. El repositorio incluye el prompt de replicación que reconstruye la app entera desde una carpeta vacía, con los contratos, los tokens y las dieciséis trampas que costaron tiempo la primera vez.`
- `¿Qué se usó?` — `Next.js, Clerk, MongoDB Atlas, Vercel Blob y Higgsfield para imagen y video. GitHub Spec Kit para el flujo de especificación.`

**Cierre**
- Titular: `Toma una foto. Mira qué sale.`
- Botón: `Probar la app`
- Debajo, en `.caption`: `El código, la especificación y los 39 tickets están en GitHub.`

---

## 9. Responsive y accesibilidad

- **360px primero.** Escribe el CSS para móvil y ensancha con `min-width`.
  Ningún `max-width` media query en toda la hoja — la dirección tiene que
  quedar greppable, igual que en la app.
- Ninguna sección hace scroll horizontal a 360px. Ni el diagrama: en móvil se
  reordena a vertical, no se encoge hasta ser ilegible.
- Un solo `<h1>`, el del héroe. Después `<h2>` por sección, sin saltar niveles.
- Todo lo interactivo se alcanza con Tab, en orden visual, con foco visible.
- El video del héroe: `muted`, `playsinline`, sin autoplay con sonido nunca, y
  con `aria-label` describiendo qué se ve.
- Las capturas de pantalla llevan `alt` que describe lo que muestran, no
  «captura de pantalla».
- Los `<summary>` son botones reales para el lector de pantalla porque son
  elementos nativos — no los reemplaces por `div` con `onclick`.
- Contraste: mínimo 4.5:1 para texto normal, 3:1 para texto grande y bordes de
  controles. Ver la nota de `ink-tertiary` en §4.
- `<html lang="es">`. `<title>` y `<meta name="description">` escritos, no
  autogenerados. Open Graph con una imagen de 1200×630 que sea un fotograma
  real del producto.

---

## 10. Assets

Nada de fotos de stock, nada de ilustraciones genéricas de IA, nada de mockups
de portátil flotando.

Necesitas exactamente cinco archivos:

1. `photo.jpg` — la foto original, tomada con un celular. Que se vea tomada por
   una persona, no producida.
2. `generated.jpg` — la imagen generada por la app a partir de esa foto.
3. `video.mp4` — el video generado a partir de esa imagen. Menos de 2MB, H.264,
   sin audio, y su `poster` es `generated.jpg`.
4. Capturas reales de las pantallas capture y result, a 360px de ancho, tomadas
   con el modo dispositivo del navegador.
5. La imagen de Open Graph, 1200×630, con un fotograma real.

Genera 2 y 3 con el pipeline real: si hay MCP de Higgsfield, por ahí; si no,
usa la app desplegada y descarga el resultado. Los dos primeros pasos del héroe
tienen que ser el mismo par foto/imagen, o la secuencia miente.

Optimiza: `generated.jpg` en WebP con respaldo JPEG, capturas en WebP, todo con
`width`, `height` y `loading="lazy"` salvo el héroe, que va `eager` y con
`fetchpriority="high"`.

---

## 11. Anti-patrones

Cada uno de estos es una razón para rehacer la sección:

1. **Rejilla de tres tarjetas con adjetivos vagos** — «Rápido», «Seguro»,
   «Escalable». Si la tarjeta no dice un hecho verificable, sobra.
2. **Titular con verbo de folleto** — «Desata», «Potencia», «Transforma»,
   «Revoluciona». El titular describe lo que pasa, no lo que se siente.
3. **Testimonios inventados,** aunque sean «de ejemplo». Sin quotes reales de
   los cuatro, no hay bloque de testimonios. Punto.
4. **Métricas falsas** — «+10.000 usuarios», «99.9% uptime». Los únicos números
   permitidos son los de §1.
5. **Gradiente morado-cian de fondo.** Es el uniforme de las landings de IA
   generadas en cinco minutos, y se reconoce al instante.
6. **Emojis como iconos** en secciones de producto. Los iconos son SVG inline de
   20×20 con trazo, del mismo set que la app.
7. **Efecto de cristal esmerilado** sobre todo. Aquí la profundidad son
   superficies y hairlines.
8. **Contador que sube al hacer scroll** en la franja de números. Cinco cifras
   quietas se leen; cinco cifras girando, no.
9. **Un menú de navegación completo** con cinco enlaces a anclas.
10. **Sección de precios.** La app no cobra. No inventes una.
11. **Un segundo momento animado** que compita con el héroe.
12. **Explicar Spec Kit antes de explicar el producto.** El proceso es la
    segunda mitad de la página, siempre.

---

## 12. Definición de terminado

Mecánico. Cada línea se comprueba, no se opina:

- [ ] `landing/index.html` abre en el navegador sin servidor, sin build y sin
      peticiones de red aparte de las fuentes y sus propios assets.
- [ ] Los diez tokens de color de §4 aparecen verbatim; ningún hex de la paleta
      escrito a mano en otro sitio del archivo.
- [ ] Ningún tamaño de fuente fuera de la tabla de §4.
- [ ] Los ocho bloques de §5 existen, en ese orden.
- [ ] Todo string visible sale del copy deck de §8, o es factualmente
      verificable en el repositorio.
- [ ] Ningún número de la página fuera de la tabla de §1.
- [ ] Cero testimonios, cero logos, cero métricas de uso.
- [ ] Sin scroll horizontal a 360px, 390px, 768px y 1440px.
- [ ] Con JavaScript deshabilitado la página se ve completa y todos los enlaces
      funcionan.
- [ ] Con `prefers-reduced-motion: reduce` nada se mueve, y el contenido del
      héroe sigue siendo legible.
- [ ] Recorrido completo con Tab: orden visual, foco visible en cada parada.
- [ ] Lighthouse ≥ 95 en las cuatro categorías, en móvil.
- [ ] CLS = 0 medido, no estimado.
- [ ] Peso de la primera vista < 500KB.
- [ ] JS total < 8KB sin comprimir, sin una sola dependencia.
- [ ] Exactamente un momento animado en toda la página.
- [ ] El CTA primario es visible sin scroll en 360×640.
- [ ] Los tres assets del héroe son el mismo par foto → imagen → video.

---

## Fuentes

La estructura de §5 y las reglas de §11 salen de:

- Evil Martians, [*We studied 100 devtool landing pages*](https://evilmartians.com/chronicles/we-studied-100-devtool-landing-pages-here-is-what-actually-works-in-2025)
  — orden héroe → confianza → funciones → prueba social → soporte → CTA final;
  las narrativas orientadas al problema ganan a las listas de funciones; los
  testimonios curados van abajo, después de contar el producto; «no salesy BS».
- [LandingPageFlow, sobre colocación de CTA](https://www.landingpageflow.com/post/best-cta-placement-strategies-for-landing-pages)
  — los menús de navegación cuestan de 10% a 15% de conversión.
- [ContentMation, guía de sección héroe](https://contentmation.com/conversion/hero-section-design-guide)
  — la atención se concentra por encima del pliegue; la primera pantalla
  responde para quién es, qué produce y por qué ahora.
- [Framiq, SaaS landing pages 2026](https://framiq.app/blog/best-saas-landing-pages-2026)
  — capturas reales de producto en el héroe; Inter es la tipografía más común
  en landings de app.
- [Digital Gravity, landings premiadas 2026](https://www.digitalgravity.ae/blog/15-award-winning-landing-page-designs-in-june-2026/)
  — el «silencio visual» y la restricción es lo que se lee como caro; una
  mecánica firma, no muchas.
- [GitHub Spec Kit](https://github.com/github/spec-kit) — el flujo
  `specify → plan → tasks → implement` y los marcadores `[P]` de ejecución
  paralela en `tasks.md`.
