# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /build

COPY package.json ./
RUN npm install --ignore-scripts

COPY . .
ENV VITE_USE_LOCAL_API=true
RUN npm run build

# Stage 2: Production Python Backend
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    FLASK_ENV=production \
    PORT=8080

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-builder /build/dist ./dist

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/api/health-check || exit 1

CMD ["sh", "-c", "gunicorn -w 2 -b 0.0.0.0:${PORT:-8080} --access-logfile - --error-logfile - backend.app:app"]
