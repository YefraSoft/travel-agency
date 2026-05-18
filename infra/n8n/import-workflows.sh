#!/bin/sh
# =============================================================
# n8n Workflow Auto-Import Script
# Imports all JSON workflows from /workflows/ directory via n8n API
# =============================================================

set -eu

WORKFLOWS_DIR="${WORKFLOWS_DIR:-/workflows}"

echo "[n8n-import] Starting workflow import from ${WORKFLOWS_DIR}..."

for file in "${WORKFLOWS_DIR}"/*.json; do
    [ -f "$file" ] || continue
    echo "[n8n-import] Importing ${file}..."
    n8n import:workflow --input="$file"
done

echo "[n8n-import] Done"
