#!/bin/sh
set -e

# Generate a session secret once and keep it in the data volume.
if [ -z "$AUTH_SECRET" ]; then
  if [ ! -f /app/data/auth_secret ]; then
    mkdir -p /app/data
    node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64'))" > /app/data/auth_secret
  fi
  AUTH_SECRET="$(cat /app/data/auth_secret)"
  export AUTH_SECRET
fi

echo "Applying database migrations…"
npx prisma migrate deploy

# Seed demo content only on the first start (empty database), so user data is never overwritten.
COUNT=$(node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.movie.count().then(c=>{console.log(c);return p.\$disconnect()})")
if [ "$COUNT" = "0" ]; then
  echo "Empty database: loading demo catalogue…"
  npx prisma db seed
fi

echo "Nocturne is running on ${APP_URL:-http://localhost:3000}"
exec npx next start -p "${PORT:-3000}"
