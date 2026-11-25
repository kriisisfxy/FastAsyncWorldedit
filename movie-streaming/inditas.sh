#!/bin/sh
cd "$(dirname "$0")"
echo "Nocturne indítása… (az első indítás 3–10 percig tarthat)"
if ! docker compose up -d --build; then
  echo "Hiba történt. Fut a Docker? Indítsd el, majd próbáld újra."
  exit 1
fi
echo "Kész! Nyisd meg: http://localhost:3000"
sleep 8
(command -v open >/dev/null && open http://localhost:3000) || (command -v xdg-open >/dev/null && xdg-open http://localhost:3000) || true
