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
