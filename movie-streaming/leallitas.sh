#!/bin/sh
cd "$(dirname "$0")"
docker compose down
echo "Nocturne leállítva. Az adatok megmaradtak."
