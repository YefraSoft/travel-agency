#!/bin/bash
# =============================================================
# n8n Workflow Auto-Import Script
# Imports all JSON workflows from /workflows/ directory via n8n API
# =============================================================

set -e

N8N_URL="${N8N_URL:-http://localhost:5678}"
WORKFLOWS_DIR="${WORKFLOWS_DIR:-/workflows}"

echo "[n8n-import] Starting workflow import from ${WORKFLOWS_DIR}..."

imported=0
failed=0

for file in "${WORKFLOWS_DIR}"/*.json; do
    [ -f "$file" ] || continue
    
    filename=$(basename "$file")
    echo "[n8n-import] Importing ${filename}..."
    
    response=$(curl -s -w "\n%{http_code}" -X POST "${N8N_URL}/api/workflows" \
        -H "Content-Type: application/json" \
        -d @"$file")
    
    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo "[n8n-import] ✅ ${filename} imported successfully"
        imported=$((imported + 1))
    else
        echo "[n8n-import] ❌ ${filename} failed (HTTP ${http_code}): ${body}"
        failed=$((failed + 1))
    fi
done

echo "[n8n-import] Done! Imported: ${imported}, Failed: ${failed}"
