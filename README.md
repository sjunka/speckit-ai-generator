# AI Media Generator

App donde tomas una foto, la IA la convierte en imagen, y esa imagen se vuelve
un video corto.

El código no existe todavía. Está descrito en `specs/` y el agente lo construye.

## Tu comando

| Quién | Comando | Rama |
|---|---|---|
| **Sergio** | `/speckit-implement fase 1` | `main` |
| **Mateo** | `/speckit-implement fase 2` | `001-frontend` |
| **Johan** | `/speckit-implement fase 3` | `001-backend` |
| **Tomás** | `/speckit-implement fase 4` | `001-dashboard` |
| **Sergio** al final | `/speckit-implement fase 5` | `main` |

**Sergio va primero.** Los otros tres no pueden empezar hasta que sus tickets
estén en `main`. Después, los tres corren al mismo tiempo.

## Los tres errores que rompen todo

1. Es `/speckit-implement`, **no** `/implement`
2. **Nunca sin decir la fase** — sin argumento construye las cinco, las tuyas y
   las de los demás
3. Nadie arranca hasta que la fase 1 de Sergio esté en `main`

## Qué hace cada quien

Cada uno copia su bloque. El nombre está arriba y la rama va escrita completa.

```bash
# ── SERGIO ── antes de la presentación, en main
git checkout main
/speckit-implement fase 1
npm run lint && npm test && npm run build
git add -A && git commit -m "Fase 1 - la base" && git push origin main
```

Cuando eso esté arriba, los tres siguientes arrancan al mismo tiempo.

```bash
# ── MATEO ── las pantallas
git pull origin main
git checkout -b 001-frontend
/speckit-implement fase 2
git add -A && git commit -m "Fase 2 - pantallas" && git push -u origin 001-frontend
```

```bash
# ── JOHAN ── el backend
git pull origin main
git checkout -b 001-backend
/speckit-implement fase 3
git add -A && git commit -m "Fase 3 - backend" && git push -u origin 001-backend
```

```bash
# ── TOMÁS ── el dashboard
git pull origin main
git checkout -b 001-dashboard
/speckit-implement fase 4
git add -A && git commit -m "Fase 4 - dashboard" && git push -u origin 001-dashboard
```

```bash
# ── SERGIO ── para cerrar, cuando los tres hayan subido
git checkout main
git merge 001-frontend 001-backend 001-dashboard
/speckit-implement fase 5
npm run dev
```

## Antes de empezar

```bash
git clone https://github.com/sjunka/speckit-ai-generator.git
cd speckit-ai-generator
bash .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
```

Si imprime una línea con `FEATURE_DIR`, estás listo.

Necesitas Claude Code con API key, Node 20 y git. Nada más.

---

📖 **[Guía completa paso a paso](docs/GUIA-SPEC-KIT.md)** · también en
[PDF](docs/GUIA-SPEC-KIT.pdf)

Ahí está qué hace cada ticket, los seis momentos de la presentación, y qué
hacer si algo falla.

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
| T031 | Junta las tres ramas | 5 | Sergio |
| T032 | **Comprueba que el backend falso y el real coinciden** | 5 | Sergio |
| T033 | Corre lint, pruebas y build; arregla lo que rompió el merge | 5 | Sergio |
| T034 | Borra los mocks que ya no hacen falta | 5 | Sergio |
| T035 | Una prueba de humo de punta a punta | 5 | Sergio |
| T036 | Revisión de calidad del código | 5 | Sergio |
| T037 | **Recorrer la app a mano en un celular** | 5 | Sergio |
| T038 | Comparar el resultado contra el proyecto original | 5 | Sergio |
| T039 | Desplegar en Vercel | 5 | Sergio |

Los cuatro en negrita son los que deciden si la app funciona. El **T008** hace
posible el trabajo en paralelo, el **T030** trae las llaves de verdad, el
**T032** atrapa el error que las pruebas no ven, y el **T037** es la demo.

La descripción larga de cada ticket, con las rutas de archivo exactas, está en
[`specs/001-ai-media-generator/tasks.md`](specs/001-ai-media-generator/tasks.md).

---

## Guion de la presentación

| # | Quién | Qué hace | Qué dice |
|---|---|---|---|
| 1 | Sergio | Abre `specs/` y `tasks.md` | Nadie escribió el código: está descrito aquí y el agente lo construye |
| 2 | Los tres | Corren su fase al mismo tiempo | Tres personas, un proyecto, sin pisarse |
| 3 | Sergio | Muestra las listas *Dueño de / Nunca toca* de dos fases | Ningún archivo aparece en dos listas: por eso no chocan |
| 4 | Los tres | Suben su rama | |
| 5 | Sergio | Merge y `fase 5` | El T032 comprueba que las piezas encajan antes de creerle a las pruebas |
| 6 | Todos | `npm run dev` y el recorrido en el celular | Foto, imagen, video, descarga |

Cierre: de una especificación escrita a una app funcionando, con el trabajo
repartido entre cuatro personas.
