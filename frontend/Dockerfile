# frontend/Dockerfile
# Purpose: Multi-stage image for Vite/React; dev stage serves the app and mirrors console errors into /logs/frontend-error.log via vite plugin.
# Imports From: frontend/package.json, pnpm-lock.yaml, vite.config.js, src/*
# Exported To: docker compose 'frontend' service

# syntax=docker/dockerfile:1.4
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm" \
    PNPM_STORE_DIR="/pnpm/store" \
    PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apk add --no-cache su-exec
RUN mkdir -p /pnpm/store && chmod -R 0777 /pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["pnpm", "run", "dev"]
