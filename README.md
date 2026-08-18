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

Los comandos exactos de cada persona, en orden, están en la
[guía](docs/GUIA-SPEC-KIT.md#cómo-lo-hacemos-entre-todos-4-personas).

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
