#!/bin/sh
set -eu

echo "[import] Starting workflow import..."

for f in /workflows/*.json; do
    [ -f "$f" ] || continue
    echo "[import] Importing $f..."
    n8n import:workflow --input="$f"
done

echo "[import] Done"
