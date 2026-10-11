#!/bin/bash
set -euo pipefail

SRC="${PLAYERS_JSON:-/opt/dotwars/apps/server/data/players.json}"
DEST="${PLAYERS_BACKUP_DIR:-/var/backups/dotwars}"
KEEP="${PLAYERS_BACKUP_KEEP:-14}"

mkdir -p "$DEST"
if [[ ! -f "$SRC" ]]; then
  echo "No players file yet: $SRC"
  exit 0
fi

stamp="$(date -u +%Y%m%d-%H%M%S)"
cp -a "$SRC" "$DEST/players-$stamp.json"
echo "Saved $DEST/players-$stamp.json"

mapfile -t old < <(ls -1t "$DEST"/players-*.json 2>/dev/null | tail -n +$((KEEP + 1)))
if ((${#old[@]} > 0)); then
  rm -f "${old[@]}"
fi
