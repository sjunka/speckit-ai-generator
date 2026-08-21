# Tickets de la HU en vivo

Un archivo por persona — `mateo.md`, `johan.md`, `tomas.md` — escritos **todos
por Sergio** en el paso 1 del Día D, antes de que nadie cree su rama. Es la
misma constitución que las cinco fases de `tasks.md`: una sola persona parte el
trabajo por propiedad de archivos, y el resto solo ejecuta lo que ya está
partido.

Cada ticket lleva cuatro secciones — Historia, Criterios de Aceptación (`CA-1`,
`CA-2`, …), Plan (los archivos exactos que toca) y Tasks (cada una apuntando a
su CA). Ningún archivo de código aparece en dos secciones Plan, que es lo que
deja correr las tres ramas a la vez sin pisarse.

Quien implementa **no edita su ticket**. Si un criterio está mal o falta un
archivo, se para y se lo dice a Sergio, que corrige en `main` y vuelve a
repartir. Un ticket que se edita mientras se implementa deja de ser trazable.

Esa es la cadena que se sigue de punta a punta: la Historia entra en `spec.md`,
se abre aquí en criterios, cada criterio tiene una prueba que se llama igual
(`it("CA-2: …")`), y el commit la cierra.

Los prompts exactos están en `docs/DIA-D.pdf`: el del reparto en el paso 1, el
de la implementación en el paso 2.
