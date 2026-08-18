# AI Media Generator

App donde el usuario toma una foto, la IA la convierte en una imagen, y esa
imagen se vuelve un video corto que puede descargar o compartir. Más un panel
para el dueño con un interruptor que apaga toda la generación.

**El código todavía no existe.** Lo que hay aquí es la descripción completa de
qué construir y en qué orden, escrita para que un agente de IA la ejecute.

## Empezar

```bash
git clone https://github.com/sjunka/speckit-ai-generator.git
cd speckit-ai-generator
/speckit-implement T001
```

Eso es todo. No hay que instalar ni configurar nada más.

> ### 📖 Lee esto primero: [Guía paso a paso](docs/GUIA-SPEC-KIT.md)
>
> Está en español, tiene la lista de tareas completa y explica qué hacer en cada
> paso. También en [PDF](docs/GUIA-SPEC-KIT.pdf) para imprimir.

## Qué hay en el repo

| Carpeta | Qué contiene |
|---|---|
| `docs/GUIA-SPEC-KIT.md` | **La guía paso a paso, en español.** Empieza por aquí |
| `specs/001-ai-media-generator/` | Qué hace la app, cómo se construye, y los 39 tickets |
| `.specify/memory/constitution.md` | Las 6 reglas que nadie rompe |
| `docs/REPLICATION-*.md` | Los documentos originales de donde salió todo esto |
| `.claude/skills/` | Los comandos `/speckit-*`, ya instalados |

## El trabajo

39 tickets, del **T001** al **T039**, repartidos así:

| Fase | Tickets | Qué es |
|---|---|---|
| **Fase 1** | T001 | Crear el proyecto |
| **Fase 2** | T002 a T009 | La base compartida: colores, botones, pruebas |
| **Fase 3** | T010 a T017 | Las pantallas |
| **Fase 4** | T018 a T025 | El backend |
| **Fase 5** | T026 a T030 | El dashboard |
| **Fase 6** | T031 a T039 | Juntar todo y desplegar |

Las fases 1 y 2 bloquean al resto. Las fases 3, 4 y 5 corren **al mismo tiempo**,
una persona cada una. La fase 6 las junta.

## Cómo lo hacemos entre todos

Somos cuatro. Cada uno tiene su bloque de tickets y su propia rama, así nadie
pisa el trabajo de otro.

| Quién | Fase | Tickets | Rama |
|---|---|---|---|
| **Sergio** | Fase 1 y 2 — crear el proyecto y la base | T001 a T009 | `main` |
| **Mateo** | Fase 3 — las pantallas | T010 a T017 | `001-frontend` |
| **Johan** | Fase 4 — el backend | T018 a T025 | `001-backend` |
| **Tomás** | Fase 5 — el dashboard | T026 a T030 | `001-dashboard` |
| **Sergio** | Fase 6 — juntar todo | T031 a T039 | `main` |

**Los tickets T001 a T009 bloquean a todos los demás.** Sergio los corre primero
y los sube a `main`. Hasta que eso no esté, los otros tres no pueden empezar.

### El comando

```
/speckit-implement T010
```

Ese comando corre **un solo ticket**, el T010. Como cada uno tiene un bloque de
varios, hay dos formas de usarlo.

**Forma A — todo tu bloque de una (la que usamos):**

```
/speckit-implement solo la Fase 3 (T010 a T017)
```

El agente trabaja los ocho tickets seguidos, marcando cada uno como hecho.

**Forma B — ticket por ticket:**

```
/speckit-implement T010
/speckit-implement T011
```

Más lento, pero si algo falla sabes exactamente en cuál. Úsala cuando la forma A
se atore.

### Cuidado: nunca lo corras sin argumento

```
/speckit-implement          ← NO
```

Sin argumento, el comando construye **los 39 tickets**: los tuyos y los de todos
los demás. Se acaba el trabajo en paralelo y se pisan entre ustedes. Siempre
dile qué fase o qué ticket te toca.

### Dos cosas más que se confunden

- El comando es **`/speckit-implement`**, no `/implement`. Spec Kit le pone el
  prefijo `speckit-` a todos sus comandos.
- El ticket es **`T001`**, no "ticket 1". Con la T y tres dígitos, tal como está
  escrito en `tasks.md`.

### Qué hace Sergio en sus dos primeras fases

No construye pantallas ni funcionalidad. Construye **las piezas compartidas que
los otros tres necesitan**. Por eso bloquea a todo el mundo.

| Ticket | Qué hace |
|---|---|
| T001 | Crea el proyecto de Next.js desde cero |
| T002 | Deja las pruebas configuradas y listas para correr |
| T003 | Define los colores del proyecto, todos en un solo archivo |
| T004 | Carga las tipografías y los tamaños de letra |
| T005 | Arma el esqueleto de la página |
| T006 | Construye los botones, tarjetas e íconos que usarán los demás |
| T007 | El ícono para instalar la app en el celular |
| T008 | **Un backend y una base de datos falsos, para probar sin internet** |
| T009 | La revisión automática en GitHub |

**El T008 es el que hace posible el trabajo en paralelo.** Gracias a ese backend
falso, Mateo puede construir y probar sus pantallas sin esperar a que Johan
termine el backend de verdad.

### Qué corre cada uno

```bash
# Sergio — antes de la presentación
/speckit-implement solo la Fase 1 y la Fase 2 (T001 a T009)

npm run lint && npm test && npm run build
git add -A && git commit -m "Base del proyecto" && git push origin main
```

```bash
# Mateo — las pantallas
git pull origin main
git checkout -b 001-frontend
/speckit-implement solo la Fase 3 (T010 a T017)
git add -A && git commit -m "Frontend" && git push -u origin 001-frontend
```

```bash
# Johan — el backend
git pull origin main
git checkout -b 001-backend
/speckit-implement solo la Fase 4 (T018 a T025)
git add -A && git commit -m "Backend" && git push -u origin 001-backend
```

```bash
# Tomás — el dashboard y las cuentas
git pull origin main
git checkout -b 001-dashboard
/speckit-implement solo la Fase 5 (T026 a T030)
git add -A && git commit -m "Dashboard" && git push -u origin 001-dashboard
```

```bash
# Sergio otra vez — juntar todo
git checkout main
git merge 001-frontend 001-backend 001-dashboard
/speckit-implement solo la Fase 6 (T031 a T039)
npm test
npm run dev
```

El paso a paso completo, con los seis momentos de la presentación, está en la
[guía](docs/GUIA-SPEC-KIT.md).

## Un aviso importante

`specs/001-ai-media-generator/tasks.md` **no se regenera nunca**. Ese archivo
dice qué archivos le tocan a cada persona, y eso es lo que permite trabajar en
paralelo sin pisarse. Si alguien corre `/speckit-tasks`, se pierde. Reviértelo.

## Nota sobre el idioma

La guía y este README están en español. Los archivos de `specs/` y
`constitution.md` están en inglés, porque son los que lee el agente y así
salieron de los documentos originales. Si el equipo los prefiere en español,
se pueden traducir — solo hay que hacerlo con cuidado, porque las rutas de
archivo y los números de ticket no se tocan.
