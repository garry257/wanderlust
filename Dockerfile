# ─────────────────────────────────────────────────────────────
#  Wanderlust – Multi-stage Production Dockerfile
#  Stage 1: Install dependencies (builder)
#  Stage 2: Lean production image (runner)
# ─────────────────────────────────────────────────────────────

# ── Stage 1: Builder ──────────────────────────────────────────
FROM node:24.14.1-alpine AS builder

WORKDIR /app

# Copy package files and install ALL deps (including devDeps for build)
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# ── Stage 2: Runner ───────────────────────────────────────────
FROM node:24.14.1-alpine AS runner

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy installed node_modules from builder
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Copy application source
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

# Expose app port
EXPOSE 8080

# Start Express server
CMD ["node", "backend/app.js"]
