# syntax=docker/dockerfile:1

# ---- Build stage -------------------------------------------------------------
# Needs devDependencies (vite, tailwind, esbuild, shadcn) so it installs everything.
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Produces dist/ (the SPA, from vite) and dist/server.cjs (the bundled server).
RUN npm run build

# ---- Runtime stage -----------------------------------------------------------
# The server bundle is built with --packages=external, so production
# dependencies still have to be present at runtime.
FROM node:24-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Cloud Run injects PORT (8080 by default); server.ts reads it.
ENV PORT=8080
EXPOSE 8080

USER node

CMD ["node", "dist/server.cjs"]
