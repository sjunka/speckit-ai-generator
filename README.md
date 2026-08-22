# AI Media Generator

App donde tomas una foto, la IA la convierte en imagen, y esa imagen se vuelve
un video corto.

**Casi nada del código existe todavía.** Está descrito en `specs/`, y el agente
lo escribe a partir de esa descripción. Eso es Spec-Driven Development: la
especificación es la fuente de verdad, el código es la salida.

En este repo ya están escritas las cuatro piezas que Spec Kit necesita — las
reglas del proyecto, qué hace la app, cómo se construye, y los 39 tickets.

**La app está construida y desplegada:**
[ia-generator-openspec.vercel.app](https://ia-generator-openspec.vercel.app/)

Las cinco fases están hechas — 35 de los 39 tickets, 25 archivos de prueba —
pero viven en la rama `ensayo-local-0819`, no en `main`. En `main` solo está la
fase 1 y la documentación. **Esa rama hay que mergearla a `main` antes del
sábado**; ver *Lo que falta antes del sábado*, abajo.

## Las reglas del Demo Day cambiaron: no se construye en vivo

El profesor publicó las indicaciones. Lo que califica es **evolucionar un
producto que ya funciona**, no construir uno delante de él:

- Hay que llegar el sábado con la app **desplegada** y con al menos un flujo
  completo Frontend → API → base de datos → API → Frontend. Datos solo en
  memoria, frontend con datos simulados o APIs que el frontend no consume
  **no cuentan**.
- En vivo dicta dos Historias de Usuario nuevas. Cada integrante corre el ciclo
  completo **en su propia máquina**: Historia → Spec → Plan → Tasks →
  Implementación → Pruebas → Commit, cada uno en su rama `feature/…`.
- Va a preguntar, textual: *«¿qué parte del Spec produjo esta implementación?»*
  y *«¿qué criterio de aceptación demuestra esta prueba?»*.

**Entonces las fases 2, 3, 4 y 5 son tarea de esta semana, no de la
presentación.** Fecha límite: **viernes**, para dejar el sábado libre. Todo lo
que sigue en este README es ese trabajo previo.

El sábado se sigue [`docs/DIA-D.pdf`](docs/DIA-D.pdf) — es la única hoja que
hay que llevar impresa, y trae la lista de lo que debe estar cierto antes de
entrar al salón.

### El truco de trazabilidad

La pregunta *«¿qué criterio de aceptación demuestra esta prueba?»* se contesta
sola si cada prueba se llama por su criterio:

```js
it("CA-2: dado un usuario sin sesión, cuando pide /capture, entonces va a sign-in", ...)
```

Y entonces, delante del profesor:

```bash
npm test -- -t "CA-2"
```

Esa demostración de dos segundos vale más que cualquier explicación: el criterio
de aceptación, la prueba y el resultado en verde en la misma pantalla. Va en los
prompts del `DIA-D.pdf`, paso 2.3, y es obligatorio para las HU del sábado.

### Lo que falta antes del sábado

| # | Qué | Quién | Por qué bloquea |
|---|---|---|---|
| 1 | **Mergear `ensayo-local-0819` a `main`** y apuntar la rama de producción de Vercel a `main` | Santiago | El `DIA-D.pdf` dice que el push a `main` dispara el despliegue. Hoy eso es falso: `main` solo tiene la fase 1. Si el sábado Santiago mergea a `main` y Vercel no lo está mirando, el paso 3 no despliega nada |
| 2 | **Poner `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`** en *Project Settings → Environment Variables* de Vercel, y redesplegar | Tomás | Está en el `.env.local` local pero no en Vercel. Sin ella `auth.protect()` no redirige a la pantalla de sign-in: devuelve un **404 pelado**. Se comprueba con `curl -sI https://ia-generator-openspec.vercel.app/capture` — hoy responde `404` con la cabecera `x-clerk-auth-reason: protect-rewrite` |
| 3 | **`npm run smoke https://ia-generator-openspec.vercel.app`** en verde, 3 de 3 | Santiago | Hoy da 2 de 3 por el punto anterior. Es el semáforo de la regla 1 del profesor |
| 4 | **T037 — el recorrido a mano en el celular**, sobre la URL pública | Todos | Entrar → foto → imagen → video → descargar. Es literalmente la demo, y nunca se ha hecho de punta a punta contra el despliegue |
| 5 | **Ensayo en seco de la HU en vivo** | Los cinco | Inventar una historia cualquiera y correr la secuencia del `DIA-D.pdf` cronometrada. Es lo que más cambia el resultado del sábado |

Y una advertencia sobre Clerk: la app está usando una instancia de **desarrollo**
(`pk_test_…`, `merry-beagle-90.clerk.accounts.dev`). Funciona, pero en un dominio
que no es `localhost` el handshake de Clerk es frágil. Una instancia de
producción necesita dominio propio con registros DNS, y un `.vercel.app` no los
admite — así que la decisión es consciente: se va con la de desarrollo y se
prueba el recorrido completo el viernes, no el sábado.

## Pruébalo en local antes de la presentación

Toma diez minutos y sirve para llegar sabiendo cómo se siente. **Hazlo en una
carpeta aparte y bórrala al terminar; no subas nada.**

```bash
# 1. Clona en una carpeta de práctica
git clone https://github.com/sjunka/speckit-ai-generator.git practica-speckit
cd practica-speckit

# 2. Retrocede al estado anterior a la fase 1, para que T001 tenga qué construir
git checkout pre-fase-1

# 3. Comprueba que el agente encuentra sus archivos
bash .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
```

Si imprime una línea con `FEATURE_DIR`, estás listo. Abre Claude Code en esa
carpeta y prueba dos comandos:

```
/speckit-analyze
```

No cambia nada. Revisa que el spec, el plan y los tickets no se contradigan, y
te muestra cómo Spec Kit lee los tres archivos juntos.

```
/speckit-implement T001
```

Este sí construye: crea el proyecto de Next.js desde cero. Míralo trabajar, y
fíjate al final en cómo marca el ticket como hecho en `tasks.md`. Ese es el
ciclo completo.

```bash
# 4. Borra la práctica
cd .. && rm -rf practica-speckit
```

Sin el `git checkout pre-fase-1` la práctica no sirve: `main` ya tiene la fase 1
construida, así que T001 no encontraría nada que hacer.

Necesitas Claude Code con API key, Node 20 y git. Nada más.

## Tu comando

| Quién | Comando | Rama | Estado |
|---|---|---|---|
| **Sergio** | `/speckit-implement fase 1` | `main` | **hecho** — ya está en `main` |
| **Mateo** | `/speckit-implement fase 2` | `001-frontend` | pendiente |
| **Johan** | `/speckit-implement fase 3` | `001-backend` | pendiente |
| **Tomás** | `/speckit-implement fase 4` | `001-dashboard` | pendiente |
| **Santiago** | `/speckit-implement fase 5` | `main` | pendiente |

Somos cinco y cada uno tiene una fase, sin repetir. **Sergio ya fue**: la fase 1
está en `main`, así que Mateo, Johan y Tomás arrancan los tres al mismo tiempo,
ya. **Santiago cierra**: junta las tres ramas y corre la fase 5.

## Los dos tags

Dos puntos marcados en la historia. Los dos importan y hacen cosas distintas.

| Tag | Qué es | Para qué |
|---|---|---|
| `pre-fase-1` | El repo sin código, solo las specs | La práctica de arriba: `/speckit-implement T001` tiene trabajo que hacer |
| `fase-1` | La fase 1 construida, antes de las otras tres | Punto de partida limpio si alguien tiene que rehacer su fase desde cero |

## Los tres errores que rompen todo

1. Es `/speckit-implement`, **no** `/implement`
2. **Nunca sin decir la fase** — sin argumento construye las cinco, las tuyas y
   las de los demás
3. Los merges de la fase 5 van **uno por uno**, nunca los tres en un solo
   comando — `git merge A B C` se cancela entero si encuentra un conflicto, y
   `package.json` va a conflictuar

## Qué hace cada quien

Cada uno copia su bloque. El nombre está arriba y la rama va escrita completa.

```bash
# ── SERGIO ── HECHO. La fase 1 ya está en main, no hay que volver a correrla.
#             Quedó marcada con el tag fase-1.
git checkout main && git pull origin main
```

Los tres siguientes arrancan al mismo tiempo, desde ya.

```bash
# ── MATEO ── las pantallas.
git checkout main && git pull origin main
git checkout -b 001-frontend
/speckit-implement fase 2
npm test
git add -A && git commit -m "Fase 2 - pantallas" && git push -u origin 001-frontend
```

```bash
# ── JOHAN ── el backend
git checkout main && git pull origin main
git checkout -b 001-backend
/speckit-implement fase 3
npm test
git add -A && git commit -m "Fase 3 - backend" && git push -u origin 001-backend
```

```bash
# ── TOMÁS ── el dashboard
git checkout main && git pull origin main
git checkout -b 001-dashboard
/speckit-implement fase 4

# El T030 es el unico con trabajo a mano: crea las cuentas, llena las ocho
# llaves y pasale el archivo a Santiago. Sin esto la app no genera nada.
cp .env.local.example .env.local

npm test
git add -A && git commit -m "Fase 4 - dashboard" && git push -u origin 001-dashboard
```

```bash
# ── SANTIAGO ── para cerrar, cuando los tres hayan subido
git checkout main && git pull origin main
git fetch origin

# Uno por uno. Nunca los tres en un solo comando.
git merge origin/001-frontend
git merge origin/001-backend
git merge origin/001-dashboard

/speckit-implement fase 5
npm test
npm run build
git add -A && git commit -m "Fase 5 - integracion" && git push origin main

# El T039: Vercel construye solo con el push. Las ocho variables van en
# Project Settings -> Environment Variables antes del primer deploy.
# Cuando el deploy este en verde, contra la URL publica y no contra localhost:
npm run smoke https://TU-APP.vercel.app
```

Ese `npm run smoke` es el último eslabón de la cadena que pide el profesor —
*branches → integración → tests → build → deploy → smoke test*. Comprueba tres
capas contra el despliegue real: que la portada responde, que `/capture` exige
sesión, y que `/api/image` rechaza al anónimo. Si las tres pasan, el flujo
Frontend → API → base de datos está vivo en una URL pública.

Dos detalles de esos merges, porque los dos rompen si se hacen mal:

- **Uno por uno.** `git merge A B C` es un merge de tres ramas a la vez y se
  cancela entero en cuanto encuentra un conflicto. El T031 dice que
  `package.json` va a conflictuar, así que ese comando fallaría siempre.
- **Con `origin/`.** Santiago no tiene las tres ramas en local, solo `main`. Por
  eso el `git fetch origin` primero y el `origin/` delante del nombre.

El único conflicto esperado es en `package.json`, donde cada rama agregó sus
dependencias. Se resuelve dejando las de todas.

**El `npm test` antes de subir.** Una línea suelta, sin encadenar con nada. No
está ahí para descubrir errores: la constitución del proyecto es test-first, así
que el agente ya escribió y corrió esas pruebas mientras construía. Está para
verlas pasar con tus propios ojos antes de que tu rama salga de tu máquina, y
para poder decir en voz alta cuántas hay en verde.

Si sale en rojo, no subas: significa que el agente dejó algo a medias, y es mejor
saberlo antes del merge que durante.

---

## Si no tienes Claude Code

No hace falta que los cinco usemos el mismo agente. `/speckit-implement` no vive
dentro de Claude Code: vive en este repo, como texto plano. Es
[`.claude/skills/speckit-implement/SKILL.md`](.claude/skills/speckit-implement/SKILL.md),
está commiteado, y son instrucciones en markdown que cualquier agente puede
seguir — Cursor, Copilot, Gemini CLI, Codex, el que tengas abierto. La carpeta se
llama `.claude/` por cómo la generó Spec Kit, no porque el contenido sea de
Claude.

Lo mismo con el resto de la maquinaria: `.specify/scripts/bash/` son scripts de
bash y `.specify/templates/` son plantillas de markdown. Nada de eso depende del
agente. Por eso un `git clone` te deja listo para trabajar, tengas lo que tengas
instalado.

### Los cuatro pasos

**1. Tu rama, igual que todos.** Copia el bloque de tu nombre de *Qué hace cada
quien*, arriba, hasta la línea del `/speckit-implement`. Esa línea es la única
que cambia.

**2. Comprueba que el agente va a encontrar sus archivos.**

```bash
bash .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
```

Tiene que imprimir una línea con `FEATURE_DIR` apuntando a
`specs/001-ai-media-generator`. Si imprime un error, no sigas: te falta el `git
pull` o estás parado en la carpeta equivocada.

**3. Pégale esto a tu agente.** Cambia el número de la fase por el tuyo y nada
más:

```text
Lee .claude/skills/speckit-implement/SKILL.md y ejecuta sus instrucciones.
Donde ese archivo dice $ARGUMENTS, el valor es: fase 2

Antes de escribir una sola línea de código, lee completos:
- .specify/memory/constitution.md
- specs/001-ai-media-generator/plan.md, sobre todo la sección Contracts
- specs/001-ai-media-generator/tasks.md, solo los tickets de mi fase
- docs/REPLICATION-PROMPT.md secciones 6, 7 y 10

Esas tres secciones del REPLICATION-PROMPT no están copiadas en el plan y son
obligatorias: la 6 tiene los valores de los tokens y las clases de tipo, la 7
tiene los strings de copy exactos que las pruebas afirman, y la 10 tiene 16
trampas que cuestan una hora cada una.

Reglas de esta sesión:
- Construye SOLO los tickets de mi fase. Ninguno de otra fase, aunque veas que
  falta algo.
- No toques ningún archivo fuera del bloque Owns de mi fase. Si necesitas un
  cambio en un archivo de otra fase, párate y dímelo en vez de commitearlo.
- Test-first: la prueba que falla primero, después el código que la pasa.
- No reescribas .gitignore. Ya está bien y tiene dos líneas que se necesitan
  después.
- Usa npm. No pnpm, no yarn, no bun.
- Marca cada ticket como [X] en tasks.md al terminarlo.
```

**4. Sube tu rama.** El `git add`/`commit`/`push` de tu bloque, sin cambios.

### Por qué el prompt insiste tanto

Las tres primeras reglas no son adorno. Son exactamente las tres formas en que
esto se rompe:

| Si el agente… | Lo que pasa |
|---|---|
| No lee `REPLICATION-PROMPT.md` §6, §7 y §10 | La app se construye y no funciona: colores inventados, strings que las pruebas no reconocen, y las trampas 21 y 22 pegando contra la API real. El `SKILL.md` **no** carga ese archivo — solo carga el plan, el spec y los tickets |
| Ignora el argumento de la fase | Construye las cinco fases. Cuando Santiago haga el merge, tu rama choca con las otras tres en todos los archivos |
| Escribe fuera de su bloque `Owns` | Conflicto de merge en un archivo que no era tuyo, en vivo, el día de la presentación |

Las otras dos reglas son más chicas y también reales: el `SKILL.md` trae un paso
que le dice al agente que cree o verifique los archivos de ignore, y nuestro
`.gitignore` tiene `!.env.local.example` y `!.env*.example`, que son las dos
líneas sin las cuales el T030 no puede commitear el archivo de ejemplo. Y un
gestor de paquetes distinto agrega un lockfile nuevo que nadie más tiene.

### Lo que NO genera conflicto

Para que nadie se frene por miedo:

- **Que cada uno use un agente distinto.** Los agentes escriben código, y el
  código va a archivos que ya están repartidos por los bloques `Owns`. Ninguna
  fase toca los archivos de otra.
- **Que tu agente escriba peor o mejor que el mío.** Las pruebas son las mismas
  para todos y están descritas en los tickets.
- **La carpeta `.claude/`.** Nadie la edita. Es de solo lectura para todos.

### Lo que sí hay que evitar

- **No corras `specify init` otra vez.** Reescribe `.specify/integration.json`
  para agregar tu agente, y ese archivo sí conflictúa al merge. La maquinaria ya
  está en el repo y sirve para cualquier agente.
- **No commitees los archivos de configuración de tu agente** — `AGENTS.md`,
  `GEMINI.md`, `.cursor/`, `.github/copilot-instructions.md`. No aportan nada al
  resultado y si dos personas suben el suyo con el mismo nombre, conflictúan.
  Déjalos sin trackear.

---

## Los 39 tickets

| Ticket | Qué hace | Fase | Quién |
|---|---|---|---|
| T001 | Crea el proyecto de Next.js desde cero | 1 | Sergio |
| T002 | Configura las pruebas y los archivos de configuración | 1 | Sergio |
| T003 | Define los colores del proyecto, todos en un archivo | 1 | Sergio |
| T004 | Carga las tipografías y los tamaños de letra | 1 | Sergio |
| T005 | Arma el esqueleto de la página | 1 | Sergio |
| T006 | Construye botones, tarjetas, íconos y el menú | 1 | Sergio |
| T007 | El ícono y el archivo para instalar la app en el celular | 1 | Sergio |
| T008 | **El backend y la base de datos falsos, para probar sin internet** | 1 | Sergio |
| T009 | La revisión automática en GitHub | 1 | Sergio |
| T010 | Protege las rutas: sin sesión no entras | 2 | Mateo |
| T011 | La pantalla de bienvenida | 2 | Mateo |
| T012 | La pantalla de inicio de sesión | 2 | Mateo |
| T013 | Tomar la foto y verla en pantalla | 2 | Mateo |
| T014 | Generar la imagen y mostrar el progreso | 2 | Mateo |
| T015 | El botón de "hacer video" y el salto a la siguiente pantalla | 2 | Mateo |
| T016 | La pantalla del video: esperar, reproducir, descargar, compartir | 2 | Mateo |
| T017 | Adaptar todas las pantallas a escritorio | 2 | Mateo |
| T018 | La conexión a la base de datos | 3 | Johan |
| T019 | Guardar las imágenes y videos en la nube | 3 | Johan |
| T020 | La conexión con la IA que genera imágenes y videos | 3 | Johan |
| T021 | La ruta que convierte una foto en imagen | 3 | Johan |
| T022 | La ruta que arranca un video | 3 | Johan |
| T023 | La ruta que consulta si el video ya está listo | 3 | Johan |
| T024 | La ruta que entrega el video para poder compartirlo | 3 | Johan |
| T025 | Correr todas sus pruebas sin llaves ni internet | 3 | Johan |
| T026 | Los costos por imagen y por video | 4 | Tomás |
| T027 | Leer y guardar la configuración del dueño | 4 | Tomás |
| T028 | La ruta que cambia la configuración, solo para el dueño | 4 | Tomás |
| T029 | La pantalla del dashboard: interruptor, calidad, contadores, gasto | 4 | Tomás |
| T030 | **Crear las cuentas reales y llenar el archivo de llaves** | 4 | Tomás |
| T031 | Junta las tres ramas | 5 | Santiago |
| T032 | **Comprueba que el backend falso y el real coinciden** | 5 | Santiago |
| T033 | Corre lint, pruebas y build; arregla lo que rompió el merge | 5 | Santiago |
| T034 | Borra los mocks que ya no hacen falta | 5 | Santiago |
| T035 | Una prueba de humo de punta a punta | 5 | Santiago |
| T036 | Revisión de calidad del código | 5 | Santiago |
| T037 | **Recorrer la app a mano en un celular** | 5 | Santiago |
| T038 | Comparar el resultado contra el proyecto original | 5 | Santiago |
| T039 | Desplegar en Vercel | 5 | Santiago |

Los cuatro en negrita son los que deciden si la app funciona. El **T008** hace
posible el trabajo en paralelo, el **T030** trae las llaves de verdad, el
**T032** atrapa el error que las pruebas no ven, y el **T037** es la demo.

La descripción larga de cada ticket, con las rutas de archivo exactas, está en
[`specs/001-ai-media-generator/tasks.md`](specs/001-ai-media-generator/tasks.md).

---

## Guion de la presentación

> **Esta sección describe el formato anterior**, en el que las fases 2 a 5 se
> construían en vivo. Con las indicaciones nuevas del profesor eso ya no aplica:
> el sábado se evoluciona un producto que ya funciona. La hoja vigente es
> [`docs/DIA-D.pdf`](docs/DIA-D.pdf). Lo de abajo se queda como material de
> respaldo — la narrativa, las frases y la lista de comandos siguen sirviendo
> para el trabajo previo de esta semana.

El guion largo, con los tiempos minuto a minuto y los 51 comandos en orden,
está en [`docs/GUION-PRESENTACION.pdf`](docs/GUION-PRESENTACION.pdf). Esto es el
resumen. Para regenerar cualquiera de los dos después de editar su `.html`:
`node scripts/build-guion-pdf.mjs` y `node scripts/build-guion-pdf.mjs DIA-D`.

### Dos carpetas, no una

El día de la presentación cada uno necesita **dos** carpetas, no una:

| Carpeta | Qué tiene | Para qué |
|---|---|---|
| El repo real | Las cinco fases construidas y el `.env.local` puesto | El `npm run dev` del final: la app funcionando de verdad |
| `demo-speckit` | El estado del tag `fase-1` | Lanzar los comandos en vivo: los agentes arrancan de verdad y las ramas no chocan |

Sin la segunda, `git checkout -b 001-frontend` falla en vivo con
`fatal: a branch named '001-frontend' already exists`, porque esa rama ya existe
del pre-build. Cada uno arma la suya antes de empezar:

```bash
git clone https://github.com/sjunka/speckit-ai-generator.git demo-speckit
cd demo-speckit
git checkout fase-1
npm install
bash .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
```

Tiene que imprimir una línea con `FEATURE_DIR`. Deja Claude Code abierto ahí.

### Los momentos

| # | Quién | Qué hace | Qué mostrar |
|---|---|---|---|
| 1 | Sergio | Explica que nadie escribió el código: está descrito y el agente lo construye | [`spec.md`](specs/001-ai-media-generator/spec.md) y [`tasks.md`](specs/001-ai-media-generator/tasks.md) |
| 2 | Los tres | Corren su fase al mismo tiempo | Las tres pantallas a la vez |
| 3 | Sergio | Señala los bloques `Owns` y `Never touches` de dos fases distintas | [`tasks.md`](specs/001-ai-media-generator/tasks.md) |
| 4 | Los tres | Suben su rama | |
| 5 | Santiago | Merge y `fase 5` | [`plan.md`](specs/001-ai-media-generator/plan.md), sección *Contracts* |
| 6 | Todos | `npm run dev` y el recorrido en el celular | La app |

**La frase del momento 3:** cada fase declara de qué archivos es dueña (`Owns`)
y cuáles no toca (`Never touches`). Ningún archivo aparece en dos listas, así
que dos personas nunca editan lo mismo. Lo que una fase necesita de otra lo usa
por la firma acordada en *Contracts* y lo reemplaza por un doble hasta que la
otra rama llega — por eso nadie espera a nadie.

### Si preguntan por los prompts

La pregunta que más se repite al ver el `spec.md` es qué se le escribió al
agente para que saliera así. Los cinco prompts, uno por comando y en orden,
están en [`docs/prompts-specs.md`](docs/prompts-specs.md), listos para copiar y
pegar en pantalla.

Cierre: de una especificación escrita a una app funcionando, con el trabajo
repartido entre cinco personas.

---

## Las cuentas y las ocho llaves (T030)

Copia [`.env.local.example`](.env.local.example) a `.env.local` y llénalo. Ese
archivo nunca se commitea — el `.gitignore` ignora `.env*` y solo deja pasar el
`.example`. Las mismas ocho variables van después en Vercel, en *Project
Settings → Environment Variables*, antes del primer deploy (T039).

**Nada de esto lo necesita la suite de pruebas.** Por la Principio II de la
constitución el `npm test` corre sin llaves, sin red y sin base de datos. Las
cuentas son para que la app funcione de verdad.

### Clerk — sesiones

1. Crea una aplicación en [dashboard.clerk.com](https://dashboard.clerk.com) y
   habilita **Google** y **email** como métodos de acceso.
2. De *API Keys* copia `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`.
3. En *Users*, sobre tu propio usuario, edita **Public metadata** y ponle:
   ```json
   { "role": "admin" }
   ```
   El dashboard se guarda con ese claim (`sessionClaims.publicMetadata.role`),
   no con el `OWNER_ID`.
4. Copia el id de ese usuario (`user_…`) a `OWNER_ID`. Esa variable es la que
   usa `isOwner` para proteger `/api/settings`.

Son dos chequeos distintos a propósito: la página mira el claim de la sesión, la
ruta mira el id. Si solo pones uno, la pantalla carga pero el interruptor no
guarda, o al revés.

### MongoDB Atlas — la base de datos

1. Crea un clúster **M0** (gratis) y una base de datos llamada `ia-generator`.
2. En *Network Access* agrega `0.0.0.0/0`. Vercel Hobby no tiene IP de salida
   fija, así que no hay una lista blanca más estrecha que sirva.
3. Copia la cadena de conexión a `MONGODB_URI`. **Lleva la contraseña dentro —
   nunca la commitees.**

### Vercel Blob — las imágenes y los videos

Crea un store de Blob en el proyecto de Vercel y copia su token de lectura y
escritura a `BLOB_READ_WRITE_TOKEN`.

Sin token la app **no se cae**: `lib/blob.js` escribe en `public/uploads` cuando
`NODE_ENV !== "production"`. Pero es un techo consciente, documentado en la
tabla de complejidad del plan — el proveedor de IA no puede alcanzar un archivo
en tu `localhost`, así que una generación real igual necesita el token o un
túnel.

### Higgsfield — el proveedor de IA

Saca la key y el secret de [cloud.higgsfield.ai](https://cloud.higgsfield.ai) y
ponlos en `HIGGSFIELD_API_KEY` y `HIGGSFIELD_API_SECRET`.

Verifica los ids de modelo contra la página *explore* antes de dar por buena la
configuración. El de imagen tiene que ser `higgsfield-ai/soul/reference`:
`soul/standard` es texto-a-imagen y **descarta la foto en silencio**, que es la
peor forma de fallar porque la app parece funcionar.

`HIGGSFIELD_VIDEO_MODEL` se deja comentado. La calidad del video se elige desde
el dashboard (`lite`/`standard`/`turbo`); esa variable solo existe para forzar
un modelo por encima de esa configuración.

### Comprobación a mano

Con `.env.local` lleno y `npm run dev` corriendo:

1. `/dashboard` renderiza para tu usuario admin.
2. `/dashboard` devuelve **404** para un segundo usuario sin el `role: admin` —
   y ese 404 no muestra ningún valor de configuración.
3. Apaga el interruptor: la siguiente generación responde **503 "Generation is
   paused"**, y la pantalla de captura lo muestra como pausa, no como error.
4. Enciéndelo otra vez: la generación vuelve. **Sin redesplegar** — ese es el
   punto de toda la Historia 4.
