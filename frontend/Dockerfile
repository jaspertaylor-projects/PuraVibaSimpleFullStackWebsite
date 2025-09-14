# frontend/Dockerfile
# Purpose: Build the Vite/React frontend, including a utility for permissions management in development.
# Imports From: package.json, pnpm-lock.yaml, ./src/*
# Exported To: docker-compose service "frontend".
# syntax=docker/dockerfile:1.4

# ---- Base Image ----
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# Add su-exec for easy user switching
RUN apk add --no-cache su-exec

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./

# THE CHANGE IS HERE: We mount a persistent cache for the pnpm store.
# id=pnpm is a unique name for our cache.
# target=/pnpm/store is where pnpm keeps its global package cache.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ---- Development ----
FROM base AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["pnpm", "run", "dev"]