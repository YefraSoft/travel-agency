#!/bin/sh
# n8n Workflow Import Script
sleep 5
echo "[import] Starting workflow import..."
for f in /workflows/*.json; do
    case "$f" in
        */import.sh) continue ;;
    esac
    echo "[import] Importing $f..."
    if curl -s -X POST http://n8n:5678/api/workflows \
        -H "Content-Type: application/json" \
        -d "@$f" > /dev/null 2>&1; then
        echo "[import] OK: $f"
    else
        echo "[import] SKIP: $f"
    fi
done
echo "[import] Done"
