# AI Media Generator

App donde tomas una foto, la IA la convierte en imagen, y esa imagen se vuelve
un video corto.

El código no existe todavía. Está descrito en `specs/` y el agente lo construye.

## Tu comando

| Quién | Comando |
|---|---|
| **Sergio** | `/speckit-implement solo la Fase 1 y la Fase 2 (T001 a T009)` |
| **Mateo** | `/speckit-implement solo la Fase 3 (T010 a T017)` |
| **Johan** | `/speckit-implement solo la Fase 4 (T018 a T025)` |
| **Tomás** | `/speckit-implement solo la Fase 5 (T026 a T030)` |
| **Sergio** al final | `/speckit-implement solo la Fase 6 (T031 a T039)` |

**Sergio va primero.** Los otros tres no pueden empezar hasta que sus tickets
estén en `main`. Después, los tres corren al mismo tiempo.

## Los tres errores que rompen todo

1. Es `/speckit-implement`, **no** `/implement`
2. Es `T001`, **no** "ticket 1"
3. **Nunca lo corras sin argumento** — construye los 39 tickets de todos

## Qué hace cada quien

```bash
# Sergio, antes de la presentación
/speckit-implement solo la Fase 1 y la Fase 2 (T001 a T009)
npm run lint && npm test && npm run build
git add -A && git commit -m "Base" && git push origin main
```

```bash
# Mateo · Johan · Tomás — los tres a la vez
git pull origin main
git checkout -b 001-frontend          # 001-backend · 001-dashboard
/speckit-implement solo la Fase 3 (T010 a T017)
git add -A && git commit -m "Mi fase" && git push -u origin 001-frontend
```

```bash
# Sergio, para cerrar
git checkout main
git merge 001-frontend 001-backend 001-dashboard
/speckit-implement solo la Fase 6 (T031 a T039)
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
