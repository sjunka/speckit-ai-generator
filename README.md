# AI Media Generator

App donde tomas una foto, la IA la convierte en imagen, y esa imagen se vuelve
un video corto.

El código no existe todavía. Está descrito en `specs/` y el agente lo construye.

## Tu comando

| Quién | Comando |
|---|---|
| **Sergio** | `/speckit-implement fase 1` |
| **Mateo** | `/speckit-implement fase 2` |
| **Johan** | `/speckit-implement fase 3` |
| **Tomás** | `/speckit-implement fase 4` |
| **Sergio** al final | `/speckit-implement fase 5` |

**Sergio va primero.** Los otros tres no pueden empezar hasta que sus tickets
estén en `main`. Después, los tres corren al mismo tiempo.

## Los tres errores que rompen todo

1. Es `/speckit-implement`, **no** `/implement`
2. **Nunca sin decir la fase** — sin argumento construye las cinco, las tuyas y
   las de los demás
3. Nadie arranca hasta que la fase 1 de Sergio esté en `main`

## Qué hace cada quien

```bash
# Sergio, antes de la presentación
/speckit-implement fase 1
npm run lint && npm test && npm run build
git add -A && git commit -m "Base" && git push origin main
```

```bash
# Mateo · Johan · Tomás — los tres a la vez, cada uno con SU fase
git pull origin main

git checkout -b 001-frontend  && /speckit-implement fase 2   # Mateo
git checkout -b 001-backend   && /speckit-implement fase 3   # Johan
git checkout -b 001-dashboard && /speckit-implement fase 4   # Tomás

git add -A && git commit -m "Mi fase" && git push -u origin <tu-rama>
```

```bash
# Sergio, para cerrar
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
