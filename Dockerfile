# ─────────────────────────────────────────────────────────────
#  Wanderlust – Monorepo Dockerfile
#  Build context: repo root (contains backend/ and frontend/)
# ─────────────────────────────────────────────────────────────
FROM node:24.14.1-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy backend package files first (for layer caching)
COPY backend/package*.json ./backend/

# Install backend dependencies
RUN cd backend && npm install --omit=dev

# Copy backend source code
COPY backend/ ./backend/

# Copy frontend assets (views + public) that Express serves at runtime
COPY frontend/ ./frontend/

# Expose port 8080 (as configured in app.js)
EXPOSE 8080

# Start the Express server from the backend directory
CMD ["node", "backend/app.js"]
