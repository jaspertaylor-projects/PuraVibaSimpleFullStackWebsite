# frontend/Dockerfile
# Purpose: Build the Vite/React frontend with a stable, writable pnpm store to prevent ERR_PNPM_UNEXPECTED_STORE.
# Imports From: package.json, pnpm-lock.yaml, ./src/*
# Exported To: docker-compose service "frontend".
# syntax=docker/dockerfile:1.4

# ---- Base Image ----
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PNPM_STORE_DIR="/pnpm/store"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# Add su-exec for easy user switching in dev
RUN apk add --no-cache su-exec
# Make sure the pnpm store exists and is writable by non-root (dev convenience)
RUN mkdir -p /pnpm/store && chmod -R 0777 /pnpm

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./

# Use a persistent cache for the pnpm store during build. Store path matches PNPM_STORE_DIR.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ---- Development ----
FROM base AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["pnpm", "run", "dev"]