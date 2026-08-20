# Specs de la HU en vivo

Un archivo por persona, escrito por su propio agente el día de la demo:
`mateo.md`, `johan.md`, `tomas.md`, `santiago.md`.

Cada uno lleva cuatro secciones — Historia, Criterios de Aceptación (`CA-1`,
`CA-2`, …), Plan (los archivos exactos que toca) y Tasks (cada una apuntando a
su CA). Dos personas nunca editan el mismo archivo de spec, y ningún archivo de
código aparece en dos secciones Plan.

Esa es la cadena que se sigue de punta a punta: la Historia entra en `spec.md`,
se abre aquí en criterios, cada criterio tiene una prueba que se llama igual
(`it("CA-2: …")`), y el commit la cierra.

Los prompts exactos están en `docs/DIA-D.pdf`, paso 2.
