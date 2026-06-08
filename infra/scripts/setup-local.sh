#!/usr/bin/env bash
set -euo pipefail

# KALEN Local Development Setup
# Run once after cloning the repository

echo "╔══════════════════════════════════════════════════╗"
echo "║   KALEN — Local Development Setup                ║"
echo "╚══════════════════════════════════════════════════╝"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 1. Copy .env.example to .env if not exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
  cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
  echo "✅ Created .env from .env.example"
  echo "⚠️  Please review and fill in secret values in .env"
else
  echo "✅ .env already exists"
fi

# 2. Install pnpm if not present
if ! command -v pnpm &> /dev/null; then
  echo "📦 Installing pnpm..."
  npm install -g pnpm@9
fi

# 3. Install dependencies
echo "📦 Installing dependencies..."
cd "$PROJECT_ROOT"
pnpm install

# 4. Start infrastructure
echo "🐳 Starting infrastructure services..."
docker compose -f "$PROJECT_ROOT/infra/docker/docker-compose.yml" up -d

# 5. Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
until docker exec kalen-postgres pg_isready -U kalen &> /dev/null; do
  sleep 1
done
echo "✅ PostgreSQL is ready"

# 6. Run database migrations
echo "🗃️  Running database migrations..."
pnpm db:migrate

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   KALEN is ready for development!                ║"
echo "║                                                  ║"
echo "║   Web:    http://localhost:3000                   ║"
echo "║   API:    http://localhost:4000                   ║"
echo "║   MinIO:  http://localhost:9001                   ║"
echo "║   Grafana:http://localhost:3001                   ║"
echo "║                                                  ║"
echo "║   Run 'pnpm dev' to start development servers    ║"
echo "╚══════════════════════════════════════════════════╝"
