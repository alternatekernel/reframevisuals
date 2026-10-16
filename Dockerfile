# Stage 1: Build Frontend
FROM public.ecr.aws/docker/library/node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# System Chromium + fonts for the SEO prerender step (scripts/prerender.mjs).
# Playwright's managed browser downloads do not support Alpine, so the
# prerenderer is pointed at this binary via PRERENDER_CHROMIUM_PATH.
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PRERENDER_CHROMIUM_PATH=/usr/bin/chromium-browser
# Fail the image build if prerendering cannot run, so an empty client-side
# rendered shell can never silently ship to production.
ENV PRERENDER_STRICT=1

# Copy frontend package files and install
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source code and root scripts used by frontend postbuild
COPY frontend/ ./
COPY scripts/ /app/scripts/

# VITE_API_URL must be baked in at build time (Vite replaces it statically)
ARG VITE_API_URL=https://reframevisuals.com/api
ENV VITE_API_URL=$VITE_API_URL

# Google OAuth client ID — also baked in statically by Vite. Supplied as a
# Coolify build-time env var; empty by default so builds without it still pass.
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# Build the self-contained SSR bundle (dist-ssr). All frontend dependencies
# are bundled in (vite ssr.noExternal: true), so the runtime image needs no
# frontend node_modules to server-render routes.
RUN npm run build:ssr

# ─────────────────────────────────────────────────────────────────
# Stage 2: Build Backend
# ─────────────────────────────────────────────────────────────────
FROM public.ecr.aws/docker/library/node:20-alpine AS backend-builder
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app/backend

COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm install

COPY backend/ .

# Compile TypeScript
RUN npm run build

# ─────────────────────────────────────────────────────────────────
# Stage 3: Production Image
# ─────────────────────────────────────────────────────────────────
FROM public.ecr.aws/docker/library/node:20-alpine
RUN apk add --no-cache openssl libc6-compat curl
WORKDIR /app

# Run as non-root in production image
RUN addgroup -S app && adduser -S app -G app

# Copy built frontend (backend serves it as static files)
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy the SSR bundle (backend renders routes per request when no
# prerendered static file exists for them)
COPY --from=frontend-builder /app/frontend/dist-ssr ./frontend/dist-ssr

# Copy compiled backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/prisma ./backend/prisma
COPY --from=backend-builder /app/backend/scripts ./backend/scripts

RUN chmod +x /app/backend/scripts/start-production.sh && chown -R app:app /app

# Runtime environment defaults (override via Coolify env vars)
ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app/backend

USER app

EXPOSE 3001

# Apply committed migrations with recovery for known failed migration state, then start the server
CMD ["sh", "./scripts/start-production.sh"]
