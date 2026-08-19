# AI Media Generator

App donde tomas una foto, la IA la convierte en imagen, y esa imagen se vuelve
un video corto.

**Casi nada del código existe todavía.** Está descrito en `specs/`, y el agente
lo escribe a partir de esa descripción. Eso es Spec-Driven Development: la
especificación es la fuente de verdad, el código es la salida.

En este repo ya están escritas las cuatro piezas que Spec Kit necesita — las
reglas del proyecto, qué hace la app, cómo se construye, y los 39 tickets.

**La fase 1 ya se corrió.** T001–T009 están construidos y en `main`, con 72
pruebas en verde, lint y build pasando. Faltan las fases 2, 3, 4 y 5.

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
| `fase-1` | La fase 1 construida, antes de las otras tres | La carpeta de demo del día de la presentación |

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
# ── MATEO ── las pantallas
git checkout main && git pull origin main
git checkout -b 001-frontend
/speckit-implement fase 2
git add -A && git commit -m "Fase 2 - pantallas" && git push -u origin 001-frontend
```

```bash
# ── JOHAN ── el backend
git checkout main && git pull origin main
git checkout -b 001-backend
/speckit-implement fase 3
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
git add -A && git commit -m "Fase 5 - integracion" && git push origin main
npm run dev
```

Dos detalles de esos merges, porque los dos rompen si se hacen mal:

- **Uno por uno.** `git merge A B C` es un merge de tres ramas a la vez y se
  cancela entero en cuanto encuentra un conflicto. El T031 dice que
  `package.json` va a conflictuar, así que ese comando fallaría siempre.
- **Con `origin/`.** Santiago no tiene las tres ramas en local, solo `main`. Por
  eso el `git fetch origin` primero y el `origin/` delante del nombre.

El único conflicto esperado es en `package.json`, donde cada rama agregó sus
dependencias. Se resuelve dejando las de todas.

**Por qué no hay `npm test` en ningún bloque.** Porque sería correrlo dos veces.
La constitución del proyecto es test-first: el agente escribe la prueba que
falla antes del código que la pasa, así que las corre solas mientras construye.
Y el **T033**, dentro de la fase 5, es literalmente
`npm run lint && npm test && npm run build`. El tiempo es corto y esos comandos
no agregan nada que el agente no haya hecho ya.

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

El guion largo, con los tiempos minuto a minuto y los 47 comandos en orden,
está en [`docs/GUION-PRESENTACION.pdf`](docs/GUION-PRESENTACION.pdf). Esto es el
resumen. Para regenerarlo después de editar el `.html` de al lado:
`node scripts/build-guion-pdf.mjs`.

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
