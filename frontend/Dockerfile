# This pragma enables Docker BuildKit features like cache mounts
# syntax=docker/dockerfile:1.4

# ---- Base Image ----
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

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