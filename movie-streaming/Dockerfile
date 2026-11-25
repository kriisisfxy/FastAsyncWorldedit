# Nocturne — single image: builds the app and runs migrations + first-time demo seed on start.
FROM node:22-bookworm-slim

# openssl: Prisma engines · ffmpeg + fonts: demo clip generation
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ffmpeg fonts-dejavu-core ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

COPY . .
# A placeholder URL is enough to build; the real one comes from docker-compose at runtime.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" AUTH_SECRET="build-only" npm run build

ENV NODE_ENV=production PORT=3000
EXPOSE 3000
RUN sed -i "s/\r$//" docker/start.sh && chmod +x docker/start.sh
CMD ["docker/start.sh"]
