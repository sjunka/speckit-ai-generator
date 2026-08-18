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

1. **T001** — crear el proyecto
2. **T002 a T009** — la base: colores, botones, configuración de pruebas
3. **T010 a T030** — el grueso. Aquí pueden trabajar tres personas a la vez
4. **T031 a T039** — juntar todo y desplegar

Los pasos 1 y 2 bloquean al resto. El paso 3 se reparte. Los detalles están en
la guía.

## Cómo lo hacemos entre todos

Somos cuatro. Cada uno tiene su bloque de tickets y su propia rama, así nadie
pisa el trabajo de otro.

| Quién | Rama | Tickets | Qué construye |
|---|---|---|---|
| **Sergio** | `main` | T001 a T009, y luego T031 a T039 | La base del proyecto, y al final junta todo |
| **Mateo** | `001-frontend` | T010 a T017 | Las pantallas que ve el usuario |
| **Johan** | `001-backend` | T018 a T025 | El backend y la conexión con la IA |
| **Tomás** | `001-dashboard` | T026 a T030 | El panel del dueño y las cuentas reales |

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
/speckit-implement Phase 3 only (T010 to T017)
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

### Qué corre cada uno

Las fases de `tasks.md` coinciden exacto con el reparto:

```bash
# Sergio — antes de la presentación
/speckit-implement Phase 1 and Phase 2 only (T001 to T009)

npm run lint && npm test && npm run build
git add -A && git commit -m "Base del proyecto" && git push origin main
```

```bash
# Mateo — las pantallas
git pull origin main
git checkout -b 001-frontend
/speckit-implement Phase 3 only (T010 to T017)
git add -A && git commit -m "Frontend" && git push -u origin 001-frontend
```

```bash
# Johan — el backend
git pull origin main
git checkout -b 001-backend
/speckit-implement Phase 4 only (T018 to T025)
git add -A && git commit -m "Backend" && git push -u origin 001-backend
```

```bash
# Tomás — el dashboard y las cuentas
git pull origin main
git checkout -b 001-dashboard
/speckit-implement Phase 5 only (T026 to T030)
git add -A && git commit -m "Dashboard" && git push -u origin 001-dashboard
```

```bash
# Sergio otra vez — juntar todo
git checkout main
git merge 001-frontend 001-backend 001-dashboard
/speckit-implement Phase 6 only (T031 to T039)
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
