# frontend/Dockerfile
# Purpose: Multi-stage build for the Vite/React app; defaults to the development stage for local hot-reload, with a minimal 'production' stage for serving built assets.
# Imports From: package.json, pnpm-lock.yaml, vite.config.js, ./src/*
# Exported To: docker-compose (dev uses default stage via docker-compose.yml; prod uses 'production' via docker-compose.prod.yml).
# syntax=docker/dockerfile:1.4

# ---- Base (shared) ----
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm" \
    PNPM_STORE_DIR="/pnpm/store" \
    PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# Dev convenience for dropping privileges in the dev server command path
RUN apk add --no-cache su-exec
# Writable global store cache (helps incremental installs during dev)
RUN mkdir -p /pnpm/store && chmod -R 0777 /pnpm

# ---- Dependencies (hoisted for cache) ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# Use a persistent cache mount for faster CI builds
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

# ---- Builder (creates /app/dist) ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# ---- Production (minimal runtime that serves static assets) ----
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
# Use a tiny static file server for SPA semantics (-s for history fallback)
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]

# ---- Development (DEFAULT stage; kept last so docker build w/o target yields dev image) ----
FROM base AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The dev command is still overridden by docker-compose.yml, but this keeps the image runnable standalone.
CMD ["pnpm", "run", "dev"]
