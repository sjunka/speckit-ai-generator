# Los prompts originales

Cada archivo de `specs/` salió de un comando de Spec Kit. Este documento tiene
el prompt exacto que se le pasó a cada uno, en orden, para que corriéndolos otra
vez el resultado sea el que está en el repo.

Si en la presentación alguien pregunta *"¿y qué le escribieron para que saliera
eso?"*, la respuesta está acá abajo, en bloques listos para copiar.

## Antes de leerlos, dos advertencias

**1. Los archivos declaran su origen.** Si alguien abre `spec.md` va a leer en la
cabecera *"Converted by hand from `docs/REPLICATION-PROMPT.md` §1–§8"*. Es cierto
y es a propósito: la app ya existía antes que las specs, y `REPLICATION-PROMPT.md`
es el documento que la describe entera — 11 secciones, todos los contratos, los
tokens, las 16 trampas. Los prompts de acá abajo son los que reproducen cada
archivo **desde ese mismo documento**. No son una reconstrucción a posteriori de
algo que se perdió: son el material que se le dio a cada comando.

**2. El nombre del comando cambia según dónde lo escribas.**

| Dónde | Cómo se escribe |
|---|---|
| `.specify/workflows/speckit/workflow.yml` | `speckit.specify` — con punto |
| Claude Code, al escribirlo tú | `/speckit-specify` — con guion |

Los dos apuntan al mismo comando. En este repo el README usa el guion porque es
lo que la gente teclea. Los títulos de abajo usan el punto porque es lo que
declara el workflow.

## El orden

| # | Comando | Archivo que produce |
|---|---|---|
| 1 | `/speckit.constitution` | `.specify/memory/constitution.md` |
| 2 | `/speckit.specify` | `specs/001-ai-media-generator/spec.md` |
| 3 | `/speckit.plan` | `specs/001-ai-media-generator/plan.md` |
| 4 | `/speckit.tasks` | `specs/001-ai-media-generator/tasks.md` |
| 5 | `/speckit.implement fase N` | `app/` · `components/` · `lib/` |

Cada comando lee lo que dejó el anterior. Correrlos desordenados no falla con un
error: produce un archivo peor, en silencio.

Antes del comando 1, una sola vez, se creó la carpeta `.specify/` con
`specify init` y se puso `docs/REPLICATION-PROMPT.md` dentro del repo. Los cinco
prompts asumen que ese archivo está ahí y que el agente puede leerlo.

---

## 1 · `/speckit.constitution`

Produce `.specify/memory/constitution.md` — las reglas que ningún ticket puede
romper. Es el único archivo que los otros cuatro comandos leen siempre.

```text
/speckit-constitution

Escribe la constitución de este proyecto a partir de docs/REPLICATION-PROMPT.md.
Lee §0 (el contrato de exactitud), §2 (stack y restricciones), §8 (testing) y
§10 (las trampas) antes de escribir nada.

Seis principios, en este orden, con estos nombres:

I. Test-First (NO NEGOCIABLE) — se commitea la prueba que falla, después el
   código que la pasa. Cada escenario de la spec tiene una prueba que falló
   antes de que existiera su implementación, y ese orden es verificable en el
   historial de git. Una prueba escrita después del código afirma lo que el
   código hace, no lo que la spec pide, y no cuenta como hecho. Deja escrito
   que el plan original de este producto listaba las pruebas como no-objetivo
   y que este principio lo anula deliberadamente y por escrito.

II. La suite corre offline (NO NEGOCIABLE) — ninguna prueba puede pedir una API
    key, red, ni base de datos. Nombra las dos costuras de mocking que lo
    sostienen: las pantallas mockean HTTP en el borde de la ruta; las rutas y
    los módulos de lib mockean los clientes del proveedor y la base de datos.

III. Construir solo lo que está listado — la lista de fuera-de-alcance de §1 es
     vinculante, no orientativa. Enumérala completa. Toda la app son unos doce
     archivos de código; un PR que agregue mucho más está sobre-construido y se
     devuelve. Andamiaje para una necesidad futura cuenta como sobre-construir.

IV. Los tokens son el tema — la paleta existe una sola vez, en app/globals.css,
    como propiedades @theme. Un hex de la paleta en cualquier otro lado es un
    defecto y una prueba afirma su ausencia. Solo existen las clases de tipo
    nombradas en el design system. Oscuro únicamente: sin modo claro, sin
    variantes dark:, sin toggle.

V. La propiedad de archivos define el paralelismo — cada tarea declara qué
   archivos posee y cuáles nunca toca. Ningún archivo aparece en dos listas.
   Toda llamada entre tareas se fija en una firma antes de que se escriba
   cualquiera de los dos lados. Una tarea que necesita cambiar un archivo que
   no posee lo plantea; no lo commitea.

VI. El apéndice gana — docs/REPLICATION-APPENDIX.md tiene los 80 archivos
    fuente verbatim, generado desde el repo con npm run docs:appendix. Donde la
    prosa y el apéndice se contradigan, gana el apéndice. La reconstrucción
    termina cuando regenerar el apéndice y hacerle diff contra el original da
    vacío.

Después de los principios, tres secciones más:

- Additional Constraints: el stack exacto de §2 declarado como "no es una
  decisión de tiempo de tarea", el estilo de código (arrow functions, named
  exports, sin componentes de clase, sin useEffect donde sirva un handler),
  360px primero y ensanchar con md:/lg: sin media queries de max-width, y los
  pisos de accesibilidad — 44px de alto, focus ring visible, 4.5:1 de contraste.
- Development Workflow: qué corre CI en cada push (npm ci, lint, react-doctor
  contra el baseline commiteado, la suite), que el baseline sube al score
  fusionado y nunca baja, que los techos deliberados se comentan donde se toman
  nombrando el techo y el camino de salida, y que la revisión mira el diff
  contra el Principio III primero — el error más común de este código no es un
  bug, es código que no debería existir.
- Governance: esta constitución supersede cualquier otra práctica, hábito o
  preferencia, incluidos los defaults que el agente traiga puestos. Las
  enmiendas piden un PR que diga qué principio cambia, por qué, y qué del repo
  cambia con él. Un principio que un revisor o una prueba no pueda verificar no
  pertenece acá.

Versión 1.0.0, ratificada 2026-08-16.
```

**De dónde sale cada parte del archivo:** los seis títulos y su orden salen
literales del prompt; el stack de `Additional Constraints` sale de §2; los dos
techos que menciona `Development Workflow` son los mismos dos de la tabla de
complejidad del `plan.md`.

---

## 2 · `/speckit.specify`

Produce `specs/001-ai-media-generator/spec.md` — qué hace la app y por qué, sin
una palabra de tecnología. También crea la rama `001-ai-media-generator`.

```text
/speckit-specify

La descripción de la feature es docs/REPLICATION-PROMPT.md §1 a §8. Léelas
enteras. Escribe el QUÉ y el POR QUÉ; toda la tecnología se va a plan.md.

Ninguna de estas palabras aparece en el spec: Next.js, React, Tailwind, Clerk,
MongoDB, Vercel, Higgsfield, Vitest, MSW, Playwright. Ningún código de estado,
ninguna firma de función, ningún string de copy, ningún valor hex. Esos los
afirman las pruebas y viven en plan.md y en §5–§7 del documento fuente. Acá va
el comportamiento que esos valores codifican.

Cuatro historias de usuario, priorizadas, cada una entregable sola:

- US1 (P1) una foto se vuelve una imagen generada — entrar, fotografiar, elegir
  un mood de una lista corta, ver la imagen en la misma pantalla. Es el
  producto entero en una pantalla y nada se entrega antes que ella.
- US2 (P2) la imagen se vuelve un video — arranca un render, se espera en una
  pantalla que dice que sigue trabajando, después reproduce.
- US3 (P3) el video sale del dispositivo — descarga, y share sheet nativo donde
  la plataforma lo soporte.
- US4 (P4) el dueño corta el gasto — un switch que detiene toda generación, un
  nivel de calidad, contadores y un gasto estimado. Va al final porque protege
  contra una factura desbocada en vez de entregar el valor del producto, y es
  la única historia que toca cuentas y llaves reales.

El design system NO es una historia de usuario. Es un requisito transversal:
va en Functional Requirements y en la fase Foundational de tasks.md. Dilo
explícitamente en el documento, porque el impulso natural es hacerlo historia.

Cada historia lleva Why this priority, Independent Test y sus Acceptance
Scenarios en formato Given/When/Then, numerados. Sácalos de §7 (pantallas) y §8
(testing) — nueve escenarios para US1, ocho para US2, tres para US3, ocho para
US4.

Después una sección de Edge Cases con los casos que §10 deja implícitos: el
switch apagado mientras un video ya está renderizando, una segunda foto después
de generar, un error de servidor que no es 404 durante el polling, una URL de
video guardada que falta, la primera escritura de settings sin registro previo,
y alguien llegando a la pantalla de resultado de un job ajeno.

Functional Requirements numerados FR-001 en adelante, agrupados en cuatro
bloques con estos títulos: Capture and generation, Video and result, Cost
controls, Cross-cutting. Los transversales incluyen los tokens, las clases de
tipo, 44px, 4.5:1, 360px, la PWA, la prueba que falla primero, la suite
offline, y CI corriendo lint + score + suite.

Key Entities: Generation (un registro por asset producido) y Settings (un solo
registro para todo el producto, cuya ausencia significa habilitado en el nivel
más barato). Descríbelas por lo que cargan, sin nombres de colección ni tipos.

Success Criteria medibles, SC-001 en adelante, con números: bajo 90 segundos
hasta la primera imagen en un teléfono, suite verde en menos de 60 segundos sin
red y sin variables de entorno, aproximadamente una docena de archivos de
código, ninguna pantalla con scroll horizontal a 360px, CI verde en un fork sin
secretos, y el diff vacío del apéndice como definición de terminado.

Una sección de Assumptions que registre lo que no es obvio: un solo rol más
allá de "con sesión", un solo proveedor para los dos trabajos de generación
(el plan original asumía tres proveedores y un selector de cuatro modelos — el
producto entregado usa uno y selecciona calidad de video; ese plan se borró en
vez de guardarse, porque un documento viejo que describe un pipeline que el
producto no tiene es una trampa para el siguiente lector), que no hay modo
offline, que los valores exactos viven en plan.md a propósito, que la lista de
fuera-de-alcance de §1 es vinculante, y que las pruebas eran un no-objetivo del
spec original y ese override fue deliberado.

Cierra con una tabla de Clarifications: diez preguntas que este archivo
responde, con su sección, su estado y la respuesta en una línea. Son las
preguntas que alguien haría al leerlo — quién lo usa, cuál es la tajada más
chica, si el design system es historia, qué queda fuera, cómo se mide el éxito,
qué pasa si se pausa a mitad de vuelo, si los códigos de estado van acá, si el
acceso al dashboard y a settings son el mismo chequeo, si las pruebas siempre
fueron obligatorias, y qué define terminado.
```

**Por qué la tabla de Clarifications ya viene llena:** normalmente esa sección la
escribe `/speckit.clarify` preguntándote de a una hasta cinco preguntas. Acá las
respuestas ya existían en el documento fuente, así que se escribieron directo y
el comando no se corrió. Si preguntan por `/speckit.clarify` en la presentación,
esa es la respuesta: no se saltó, se resolvió antes.

---

## 3 · `/speckit.plan`

Produce `specs/001-ai-media-generator/plan.md` — el stack exacto y los contratos
entre fases. Este es el archivo que permite que tres personas construyan sin
verse.

```text
/speckit-plan

El contexto técnico es docs/REPLICATION-PROMPT.md §2 (stack) y §5 a §7
(contratos, design system, pantallas). Léelas antes de escribir.

Technical Context con las entradas del template llenas de §2: lenguaje,
dependencias con sus versiones, almacenamiento, testing, plataforma objetivo,
tipo de proyecto, metas de rendimiento, restricciones y escala. En Performance
Goals di el número medido y su matiz: 90 segundos es el objetivo para el
trabajo del producto y se cumple con la cola del proveedor tranquila (una
corrida real: ~60s); la cola es compartida y no es nuestra, así que es un
objetivo y no una afirmación — el poll inline de la ruta le da 120s antes de
rendirse con un error de timeout.

Constitution Check: una fila por principio, con el veredicto y una línea de
cómo este plan lo satisface. Los seis pasan; dilo también después del diseño.

Contracts es la sección que importa. Va antes de las tareas y se fija antes de
que se escriba una línea, porque es lo que permite el paralelismo: una tarea
escribe contra la firma y el archivo que llama llega después, en otra rama.
Copia de §5:

- Modules: las firmas exactas de lib/db.js, lib/settings.js, lib/models.js,
  lib/higgsfield.js y lib/blob.js, como un bloque de JavaScript con las firmas
  y su comentario, no como prosa.
- HTTP: una tabla con las cinco rutas, su método, su request y todas sus
  respuestas con código de estado. Las pantallas llaman fetch y nunca importan
  lib/ — esta tabla es la costura, y es contra ella que se escriben los
  handlers de MSW.
- Data: una base de datos, dos colecciones, con la forma de cada documento.
- Provider: la URL, el header de auth, la forma de la respuesta, los modelos, y
  los tres detalles que se descubrieron contra la API real — que los assets
  vienen envueltos en objetos y no como strings planos, que el poll tiene que
  lanzar cuando se le acaban los intentos y cuando la URL falta, y los tiempos
  medidos.

Agrega una nota explícita donde la tabla HTTP muestra las dos lecturas de
/api/video/[id]: no llevan sesión a propósito, no hay fila 401, el id es
inadivinable y leerlo de vuelta no expone nada enumerable. Que nadie lo lea
como un olvido ni le agregue auth sin cambiar el spec.

Antes del Summary, una tabla de lectura obligatoria: §6, §7 y §10 del documento
fuente NO están reproducidas acá y hay que leerlas antes de escribir código,
porque /speckit-implement carga la constitución, el spec, el plan y los tickets
— y no carga los documentos fuente. Di de cada una qué fija y por qué no está
inlineada.

Project Structure con el árbol de archivos real. Di explícitamente que no hay
research.md, ni data-model.md, ni carpeta contracts/: el documento fuente ya
resolvió cada pregunta abierta y los contratos están inlineados arriba, donde
las tareas pueden verlos. Un research.md generado solo lo repetiría con menos
precisión.

Complexity Tracking con los dos techos deliberados que este proyecto sí toma:
el fallback de lib/blob.js escribiendo a public/uploads sin token en desarrollo,
y doctor.config.json apagando la regla effect-needs-cleanup. Cada uno con por
qué se necesita y por qué se rechazó la alternativa simple.

Encabeza el archivo con una nota: no regenerar este archivo desde el spec. Los
contratos de abajo son lo que deja correr cuatro tareas en paralelo, y un plan
regenerado los volvería a derivar distinto.
```

**El detalle que hace todo el trabajo:** `Contracts` con las firmas literales.
Sin esa sección las fases 2, 3 y 4 no pueden arrancar el mismo día — cada una
tendría que esperar a que la otra escriba el archivo que llama.

---

## 4 · `/speckit.tasks`

Produce `specs/001-ai-media-generator/tasks.md` — los 39 tickets repartidos en
5 fases. Es el comando donde Spec Kit hay que frenarlo, no dejarlo suelto.

```text
/speckit-tasks

Los tickets salen de docs/REPLICATION-PROMPT.md §9, verbatim. §9 tiene cinco
tareas; expándelas en sus tickets numerados sin mover ni un límite entre ellas.
No vuelvas a derivar el corte desde spec.md.

Esto es lo importante y va escrito dentro del archivo, arriba, como una nota
que diga "no regenerar este archivo": las fases están agrupadas por PROPIEDAD
DE ARCHIVOS, no por historia de usuario, y eso es deliberado. Los bloques de
propiedad son lo que hace seguro que tres agentes trabajen en tres ramas: ningún
archivo aparece en dos listas, y toda llamada entre fases está fijada en la
sección Contracts del plan antes de que se escriba cualquiera de los dos lados.
Regenerar el corte desde el spec produciría un desglose con forma de historia
que pierde las tablas de propiedad, y el paralelismo con ellas.

Cinco fases, con nombre en español, una por persona:

- Fase 1 — La base (Sergio). BLOQUEA A TODOS: ninguna otra fase empieza hasta
  que ésta esté en main. Posee todo lo que no posean las fases 2, 3 y 4.
- Fase 2 — Las pantallas. Todo lo que el usuario toca, hablándole a la API solo
  por fetch contra los handlers de MSW de la fase 1.
- Fase 3 — El backend. El pipeline detrás de las pantallas.
- Fase 4 — El dashboard. Las dos palancas del dueño, más las cuentas reales.
- Fase 5 — Juntar todo (Santiago). El merge, que es donde una construcción en
  paralelo realmente falla, así que es una fase de verdad y no un trámite.

Las fases 2, 3 y 4 corren en paralelo entre ellas después de que la 1 aterrice.

Cada fase declara tres cosas antes de sus tickets: Owns (los archivos que
posee), Never touches (los que tiene prohibido tocar), y qué importa por firma
de otra fase. Donde una fase importe un módulo que otra todavía no escribió,
deja escrito que "mockearlo" significa crear un archivo stub físico en esa ruta
exacta con la firma de Contracts, comentado como reemplazable — porque Vitest
resuelve los imports de ES contra el filesystem real antes de que vi.mock corra,
así que un mock de una ruta que no existe falla con "Failed to resolve import".
El merge de la fase 5 espera esas colisiones y se queda con la implementación
real.

Cada ticket lleva su id (T001 en adelante), su marca [P] si puede correr en
paralelo dentro de la fase, su etiqueta [US#] de la historia a la que sirve, y
rutas de archivo exactas en la descripción. Los tickets que arreglan una trampa
de §10 la citan por número entre paréntesis, para que quien lo lea sepa que la
instrucción rara tiene una hora de dolor detrás.

Los tickets de prueba son obligatorios, no opcionales: el Principio I de la
constitución hace test-first no negociable en esta feature. Cada ticket dice su
prueba antes de su implementación.

Al final de cada fase, un Checkpoint que diga qué tiene que estar verde para
poder seguir.

Cierra con: la sección de dependencias y orden de las fases, las oportunidades
de paralelismo dentro de cada una, un ejemplo con git worktree de los tres
agentes arrancando a la vez después de la fase 1, y una estrategia de
implementación con la ruta MVP y la ruta de una sola persona trabajando sola.
```

**Lo que Spec Kit quiere hacer acá y no hay que dejarlo:** regenerar el desglose
desde `spec.md`. Sale un `tasks.md` ordenado por historia de usuario, que se lee
bien y que no se puede repartir entre cinco personas — porque las mismas
historias tocan los mismos archivos.

---

## 5 · `/speckit.implement fase N`

No lleva prompt. El argumento es el prompt entero.

```text
/speckit-implement fase 2
```

El comando carga la constitución, el `spec.md`, el `plan.md` y el `tasks.md`, y
construye los tickets de esa fase, uno por uno, escribiendo la prueba antes del
código. Al terminar cada ticket lo marca hecho en `tasks.md`.

| Quién | Comando | Rama |
|---|---|---|
| Sergio | `/speckit-implement fase 1` | `main` |
| Mateo | `/speckit-implement fase 2` | `001-frontend` |
| Johan | `/speckit-implement fase 3` | `001-backend` |
| Tomás | `/speckit-implement fase 4` | `001-dashboard` |
| Santiago | `/speckit-implement fase 5` | `main` |

**Nunca sin argumento.** `/speckit-implement` a secas construye las cinco fases
— la tuya y las de los otros cuatro.

También acepta un ticket suelto, que es lo que se usa para practicar en una
carpeta aparte:

```text
/speckit-implement T001
```

---

## Los comandos que no salen en el diagrama

Spec Kit trae más de cinco. Estos tres existen y no se corrieron, por razones
que vale la pena poder decir en voz alta:

| Comando | Qué hace | Por qué no está |
|---|---|---|
| `/speckit-clarify` | Pregunta hasta cinco cosas del spec y escribe las respuestas en él | Las respuestas ya estaban en el documento fuente; la tabla de Clarifications de `spec.md` se escribió directo |
| `/speckit-analyze` | Lee spec, plan y tickets juntos y reporta contradicciones. No cambia nada | Sí se corre — es la práctica recomendada del README antes de la presentación, justamente porque no toca nada |
| `/speckit-checklist` | Genera un checklist a medida de la feature | Los Checkpoints por fase de `tasks.md` ya cumplen esa función |
