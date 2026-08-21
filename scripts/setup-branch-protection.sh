#!/usr/bin/env bash
# Protege main y develop contra pushes directos.
# Requiere: gh auth login (con permisos de admin sobre el repo).
# Uso: ./scripts/setup-branch-protection.sh
set -euo pipefail

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
echo "Configurando protecciones en $REPO"

# --- develop: sin push directo, CI obligatorio, sin approvals ---
gh api -X PUT "repos/$REPO/branches/develop/protection" \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Lint, tests y build", "Compatibilidad con la rama destino"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": true,
  "required_conversation_resolution": true
}
JSON

# --- main: sin push directo, CI obligatorio + 1 approval del equipo ---
gh api -X PUT "repos/$REPO/branches/main/protection" \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Lint, tests y build", "Compatibilidad con la rama destino"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": true,
  "required_conversation_resolution": true
}
JSON

# Necesario para que el auto-merge de develop funcione
gh api -X PATCH "repos/$REPO" -f allow_auto_merge=true -f allow_squash_merge=true >/dev/null

echo "Listo. main y develop solo aceptan cambios vía Pull Request."
