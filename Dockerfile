# ── Stage 1: Build Frontend ──
FROM node:20-slim AS frontend-builder
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies ignoring electron-builder postinstall script
RUN npm install --ignore-scripts

# Copy frontend source files
COPY . .

# Build frontend with local-api mode enabled
ENV VITE_USE_LOCAL_API=true
RUN npm run build

# ── Stage 2: Runtime Container ──
FROM python:3.11-slim
WORKDIR /app

# Install curl for container health check
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend files and compiled frontend
COPY backend/ backend/
COPY --from=frontend-builder /app/dist dist/

# Default environment configuration
ENV PORT=8080
ENV PYTHONUNBUFFERED=1
ENV DOCKER_CONTAINER=1
ENV DATA_DIR=/root/.lifeos

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/health-check || exit 1

CMD ["sh", "-c", "python3 backend/serve.py --no-open --no-build --port ${PORT}"]
