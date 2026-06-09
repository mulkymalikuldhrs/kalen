# KALEN — Deployment Documentation

**Author:** Mulky Malikul Dhaher (mulkymalikuldhr@mail.com)
**Last Updated:** 2026-06-09

> **⚠️ KALEN is pre-alpha software.** The Docker Compose local development stack exists and works. The NestJS API server and Next.js web client are implemented but use in-memory stores and simulated data. The Kubernetes production manifests, production overrides, and many infrastructure configs are **planned but not yet created or tested**. This document describes both what exists and what is planned, clearly marking each.

---

## Table of Contents

1. [Deployment Options Overview](#1-deployment-options-overview)
2. [Docker Compose — Local Development](#2-docker-compose--local-development)
3. [Docker Compose — Staging / Single-Node Production](#3-docker-compose--staging--single-node-production)
4. [Kubernetes — Production Deployment](#4-kubernetes--production-deployment)
5. [Environment Variables Reference](#5-environment-variables-reference)
6. [Scaling Guidelines](#6-scaling-guidelines)
7. [Backup and Recovery](#7-backup-and-recovery)
8. [Monitoring Setup](#8-monitoring-setup)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Deployment Options Overview

| Option | Use Case | Status | Complexity |
|--------|----------|--------|-----------|
| Docker Compose (dev) | Local development | ✅ Exists and works | Low |
| Docker Compose (prod) | Single-node staging/production | 📋 Planned | Medium |
| Kubernetes (Kustomize) | Multi-node production | 📋 Planned | High |

---

## 2. Docker Compose — Local Development

**Status: ✅ Exists and works**

The local development stack is defined in `infra/docker/docker-compose.yml`. It runs 11 services on a single machine.

### 2.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose (dev)                       │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Traefik  │  │PostgreSQL│  │  Redis   │  │   NATS   │   │
│  │ :80/:443 │  │  :5432   │  │  :6379   │  │  :4222   │   │
│  │ :8080    │  │ +pgvector│  │          │  │JetStream │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  MinIO   │  │ Elastic  │  │ LiveKit  │  │  coturn  │   │
│  │:9000/:1 │  │  :9200   │  │:7880-7882│  │  :3478   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │Prometheus│  │ Grafana  │  │   Loki   │                  │
│  │  :9090   │  │  :3001   │  │  :3100   │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                              │
│  Network: kalen-net (bridge)                                  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Prerequisites

| Requirement | Version | Installation |
|-------------|---------|--------------|
| Docker | 24+ | [docker.com](https://www.docker.com/) |
| Docker Compose | v2+ | Included with Docker Desktop |
| pnpm | 9.15+ | `npm install -g pnpm@9` |
| Node.js | 20 LTS | [nodejs.org](https://nodejs.org/) |

### 2.3 Quick Start

```bash
# Clone and setup
git clone https://github.com/mulkymalikuldhr/kalen.git
cd kalen
bash infra/scripts/setup-local.sh

# Or manually:
cp .env.example .env
pnpm install
docker compose -f infra/docker/docker-compose.yml up -d
# Wait for PostgreSQL to be ready
pnpm db:migrate
```

### 2.4 Service Details

| Service | Image | Port(s) | Purpose |
|---------|-------|---------|---------|
| **traefik** | traefik:v3.2 | 80, 443, 8080 | API gateway, reverse proxy, TLS termination |
| **postgres** | pgvector/pgvector:pg16 | 5432 | Primary database with uuid-ossp and pgvector extensions |
| **redis** | redis:7-alpine | 6379 | Session cache, rate limiting, challenge store |
| **nats** | nats:2-alpine | 4222, 8222 | Event bus with JetStream persistence |
| **minio** | minio/minio:latest | 9000, 9001 | S3-compatible object storage |
| **elasticsearch** | elasticsearch:8.15.0 | 9200 | Full-text search |
| **livekit** | livekit/livekit-server:latest | 7880, 7881, 7882/udp | WebRTC SFU for audio/video |
| **coturn** | coturn/coturn:latest | 3478 (host network) | TURN server for NAT traversal |
| **prometheus** | prom/prometheus:latest | 9090 | Metrics collection |
| **grafana** | grafana/grafana:latest | 3001 | Dashboards and visualization |
| **loki** | grafana/loki:latest | 3100 | Log aggregation |

### 2.5 Volumes

All data is persisted in named Docker volumes:

```bash
# List volumes
docker volume ls | grep kalen

# Volume mapping:
# postgres-data  → PostgreSQL data
# redis-data     → Redis persistence
# minio-data     → MinIO object storage
# nats-data      → NATS JetStream store
# es-data        → Elasticsearch indices
# prometheus-data → Prometheus metrics
# grafana-data   → Grafana dashboards and config
# loki-data      → Loki log storage
```

### 2.6 Useful Commands

```bash
# Start all services
pnpm infra:up

# Stop all services (data preserved)
pnpm infra:down

# View logs
pnpm infra:logs

# View logs for a specific service
docker compose -f infra/docker/docker-compose.yml logs -f postgres

# Restart a single service
docker compose -f infra/docker/docker-compose.yml restart redis

# Check service health
docker compose -f infra/docker/docker-compose.yml ps

# Wipe all data and start fresh
docker compose -f infra/docker/docker-compose.yml down -v
docker compose -f infra/docker/docker-compose.yml up -d
```

### 2.7 Default Credentials (Development Only)

| Service | Username | Password |
|---------|----------|----------|
| PostgreSQL | kalen | kalen_dev |
| Redis | — | kalen_dev |
| MinIO | kalen_dev | kalen_dev_secret |
| Grafana | admin | admin |
| LiveKit | devkey | devsecret |

**⚠️ These credentials are for local development only. Never use them in staging or production.**

---

## 3. Docker Compose — Staging / Single-Node Production

**Status: 📋 Planned — `docker-compose.prod.yml` does not exist yet**

### 3.1 Production Overrides

The production override file (`infra/docker/docker-compose.prod.yml`) will modify the development stack with:

```yaml
# Planned content (not yet created)
version: "3.9"

services:
  traefik:
    command:
      - "--certificatesresolvers.letsencrypt.acme.email=acme@kalen.example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/etc/traefik/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
    deploy:
      replicas: 1
      resources:
        limits:
          memory: 512M
          cpus: "1.0"
      restart_policy:
        condition: unless-stopped

  postgres:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # No default — must be set
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: "2.0"
      restart_policy:
        condition: unless-stopped

  redis:
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    deploy:
      resources:
        limits:
          memory: 1G
      restart_policy:
        condition: unless-stopped

  # ... similar resource limits and restart policies for all services
```

### 3.2 Deployment Steps (Planned)

```bash
# 1. Set production environment variables
cp .env.example .env
# Edit .env with production values — ALL secrets must be filled

# 2. Start with production overrides
docker compose \
  -f infra/docker/docker-compose.yml \
  -f infra/docker/docker-compose.prod.yml up -d

# 3. Verify all services are healthy
docker compose \
  -f infra/docker/docker-compose.yml \
  -f infra/docker/docker-compose.prod.yml ps

# 4. Run database migrations
pnpm db:migrate

# 5. Verify TLS certificate provisioning
curl -I https://kalen.example.com/api/v1/health
```

### 3.3 TLS Configuration (Planned)

- **Let's Encrypt** via Traefik ACME (TLS-ALPN-01 challenge)
- **Certificate storage** in `acme.json` (gitignored)
- **Auto-renewal** handled by Traefik
- **HSTS** enabled via security headers middleware

### 3.4 Resource Limits (Planned)

| Service | Memory Limit | CPU Limit | Notes |
|---------|-------------|-----------|-------|
| Traefik | 512 MB | 1.0 | Sufficient for <10K concurrent connections |
| PostgreSQL | 2 GB | 2.0 | Shared buffers: 512MB, work_mem: 16MB |
| Redis | 1 GB | 1.0 | maxmemory: 512MB with allkeys-lru eviction |
| NATS | 512 MB | 1.0 | JetStream storage limited to 1GB |
| MinIO | 1 GB | 1.0 | Depends on object count |
| Elasticsearch | 2 GB | 2.0 | Heap: 1GB (ES_JAVA_OPTS) |
| LiveKit | 1 GB | 2.0 | Per-SFU; CPU-bound with many participants |
| Prometheus | 512 MB | 0.5 | Depends on metrics cardinality |
| Grafana | 256 MB | 0.5 | Lightweight |
| Loki | 512 MB | 0.5 | Depends on log volume |

---

## 4. Kubernetes — Production Deployment

**Status: 📋 Planned — `infra/k8s/` directory does not exist yet**

### 4.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Ingress (Traefik) — LoadBalancer, 2 replicas         │    │
│  └────────────────────────┬────────────────────────────┘    │
│                           │                                  │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐      │
│  │ Web Client │  │ API Server │  │ Identity Service │      │
│  │ Deployment │  │ Deployment │  │ Deployment       │      │
│  │ 2 replicas │  │ 2 replicas │  │ 2 replicas       │      │
│  │ +HPA 2-10  │  │ +HPA 2-10  │  │                  │      │
│  └────────────┘  └────────────┘  └──────────────────┘      │
│                                                              │
│  ┌──────────────────── Data Plane ────────────────────┐     │
│  │ PostgreSQL │ Redis │ NATS │ MinIO │ Elasticsearch │     │
│  │ StatefulSet│Stateful│State│Stateful│  StatefulSet  │     │
│  │ 1 replica  │Set 1  │Set 1│Set 1  │  1 replica     │     │
│  │ +PVC       │+PVC   │     │+PVC   │  +PVC          │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌──────────────────── Media Plane ───────────────────┐     │
│  │ LiveKit Deployment │ coturn Deployment (hostNetwork)│     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Namespace: kalen-system                                      │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Kustomize Structure (Planned)

```
infra/k8s/
├── base/
│   ├── namespace.yaml          # kalen-system namespace
│   ├── kustomization.yaml      # Base resource references
│   ├── server/                 # API server (Deployment, Service, ConfigMap, HPA)
│   ├── web/                    # Web client (Deployment, Service)
│   ├── identity/               # Identity service (Deployment, Service)
│   ├── postgres/               # PostgreSQL (StatefulSet, Service, PVC)
│   ├── redis/                  # Redis (StatefulSet, Service)
│   ├── minio/                  # MinIO (StatefulSet, Service, PVC)
│   ├── nats/                   # NATS JetStream (StatefulSet, Service)
│   ├── elasticsearch/          # Elasticsearch (StatefulSet, Service)
│   ├── livekit/                # LiveKit SFU (Deployment, Service)
│   ├── traefik/                # Traefik Ingress (Deployment, Service, IngressRoute, Middleware)
│   └── coturn/                 # coturn TURN (Deployment, hostNetwork)
├── overlays/
│   ├── staging/
│   │   ├── kustomization.yaml  # Staging patches
│   │   └── patches/            # Reduced replicas, staging secrets
│   └── production/
│       ├── kustomization.yaml  # Production patches
│       └── patches/            # Full replicas, resource limits, sealed secrets
```

### 4.3 Deployment Commands (Planned)

```bash
# Deploy to staging
kubectl apply -k infra/k8s/overlays/staging/

# Deploy to production
kubectl apply -k infra/k8s/overlays/production/

# Or with kustomize directly
kustomize build infra/k8s/overlays/production/ | kubectl apply -f -

# Check deployment status
kubectl -n kalen-system get all

# View logs
kubectl -n kalen-system logs -f deployment/kalen-server

# Scale API server manually
kubectl -n kalen-system scale deployment/kalen-server --replicas=4
```

### 4.4 Secrets Management (Planned)

**Method: Sealed Secrets**

```bash
# Install sealed-secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Create a sealed secret
kubectl create secret generic kalen-secrets \
  --from-literal=JWT_SECRET='your-secret' \
  --from-literal=POSTGRES_PASSWORD='your-password' \
  --namespace kalen-system \
  --dry-run=client -o yaml | \
  kubeseal -o yaml > infra/k8s/overlays/production/sealed-secret.yaml

# Apply the sealed secret
kubectl apply -f infra/k8s/overlays/production/sealed-secret.yaml
```

**Never commit plaintext secrets to the repository.** The `.gitignore` excludes `sealed-secrets/` directory and `*.key` files.

### 4.5 Health Checks (Planned)

| Service | Liveness Probe | Readiness Probe |
|---------|---------------|-----------------|
| API Server | `GET /health` every 10s | `GET /health/ready` every 5s |
| Web Client | HTTP GET on `/` every 30s | HTTP GET on `/` every 10s |
| PostgreSQL | `pg_isready` every 10s | `pg_isready` every 5s |
| Redis | `redis-cli ping` every 10s | `redis-cli ping` every 5s |
| MinIO | `mc ready local` every 10s | `mc ready local` every 5s |
| Elasticsearch | `/_cluster/health` every 15s | `/_cluster/health?wait_for_status=yellow` every 10s |

### 4.6 Horizontal Pod Autoscaling (Planned)

| Service | Min Replicas | Max Replicas | Scale Trigger |
|---------|-------------|-------------|---------------|
| API Server | 2 | 10 | CPU > 70% |
| Web Client | 2 | 5 | CPU > 70% |
| Identity Service | 2 | 5 | CPU > 70% |

---

## 5. Environment Variables Reference

**Status: ✅ `.env.example` exists with all variables**

### 5.1 Application

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment: development, staging, production |
| `APP_NAME` | `KALEN` | Application name |
| `APP_URL` | `http://localhost:3000` | Public-facing web URL |
| `API_URL` | `http://localhost:4000` | API server URL |
| `WS_URL` | `ws://localhost:4000/events` | WebSocket URL |

### 5.2 Authentication (WebAuthn)

| Variable | Default | Description |
|----------|---------|-------------|
| `WEBAUTHN_RP_ID` | `localhost` | Relying Party ID (domain) |
| `WEBAUTHN_RP_NAME` | `KALEN` | Relying Party display name |
| `WEBAUTHN_ORIGIN` | `http://localhost:3000` | Relying Party origin |
| `WEBAUTHN_TIMEOUT` | `60000` | Challenge timeout in milliseconds |
| `WEBAUTHN_ATTESTATION_TYPE` | `none` | Attestation type: none, indirect, direct |

**Production note:** `WEBAUTHN_RP_ID` must match the domain name (e.g., `kalen.example.com`). `WEBAUTHN_ORIGIN` must include the scheme (e.g., `https://kalen.example.com`).

### 5.3 JWT

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | *(required)* | Token signing secret — generate with `openssl rand -base64 64 \| tr -d '\n'` |
| `JWT_EXPIRES_IN` | `24h` | Access token TTL |
| `JWT_ISSUER` | `kalen` | Token issuer claim |

### 5.4 PostgreSQL

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_HOST` | `localhost` | Database host |
| `POSTGRES_PORT` | `5432` | Database port |
| `POSTGRES_DB` | `kalen` | Database name |
| `POSTGRES_USER` | `kalen` | Database user |
| `POSTGRES_PASSWORD` | *(required)* | Database password |
| `POSTGRES_URL` | `postgresql://${USER}:${PASSWORD}@${HOST}:${PORT}/${DB}` | Full connection URL (auto-constructed) |

### 5.5 Redis

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | *(required in production)* | Redis password |
| `REDIS_URL` | `redis://${HOST}:${PORT}` | Full connection URL |

### 5.6 NATS

| Variable | Default | Description |
|----------|---------|-------------|
| `NATS_URL` | `nats://localhost:4222` | NATS server URL |
| `NATS_CLUSTER_ID` | `kalen-cluster` | JetStream cluster ID |

### 5.7 MinIO

| Variable | Default | Description |
|----------|---------|-------------|
| `MINIO_ENDPOINT` | `localhost` | MinIO endpoint |
| `MINIO_PORT` | `9000` | MinIO port |
| `MINIO_ACCESS_KEY` | *(required)* | Access key |
| `MINIO_SECRET_KEY` | *(required)* | Secret key |
| `MINIO_BUCKET` | `kalen-files` | Default bucket name |
| `MINIO_USE_SSL` | `false` | Enable SSL for MinIO connection |

### 5.8 Elasticsearch

| Variable | Default | Description |
|----------|---------|-------------|
| `ELASTICSEARCH_NODE` | `http://localhost:9200` | Elasticsearch node URL |
| `ELASTICSEARCH_INDEX_PREFIX` | `kalen` | Index name prefix |

### 5.9 LiveKit

| Variable | Default | Description |
|----------|---------|-------------|
| `LIVEKIT_HOST` | `http://localhost:7880` | LiveKit server URL |
| `LIVEKIT_API_KEY` | *(required)* | LiveKit API key |
| `LIVEKIT_API_SECRET` | *(required)* | LiveKit API secret |

### 5.10 TURN Server

| Variable | Default | Description |
|----------|---------|-------------|
| `TURN_URL` | `turn:localhost:3478` | TURN server URL |
| `TURN_USERNAME` | `kalen` | TURN username |
| `TURN_PASSWORD` | *(required)* | TURN password |
| `TURN_SECRET` | *(required)* | TURN shared secret |

### 5.11 Traefik

| Variable | Default | Description |
|----------|---------|-------------|
| `TRAEFIK_DASHBOARD` | `true` | Enable Traefik dashboard (disable in production) |
| `TRAEFIK_LOG_LEVEL` | `DEBUG` | Log level (use WARN or INFO in production) |

### 5.12 OpenIM

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENIM_API_URL` | `http://localhost:10002` | OpenIM server API URL |
| `OPENIM_SECRET` | *(required)* | OpenIM integration secret |

### 5.13 MCP Gateway

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_GATEWAY_ENABLED` | `true` | Enable MCP Gateway |
| `MCP_GATEWAY_MAX_CONCURRENT` | `50` | Max concurrent tool invocations |
| `MCP_GATEWAY_REQUEST_TIMEOUT_MS` | `30000` | Tool invocation timeout |
| `MCP_GATEWAY_RATE_LIMIT_PER_AGENT` | `100` | Max invocations per agent per minute |

### 5.14 A2A Router

| Variable | Default | Description |
|----------|---------|-------------|
| `A2A_ROUTER_ENABLED` | `true` | Enable A2A Router |
| `A2A_ROUTER_MAX_TASKS_PER_AGENT` | `1000` | Max concurrent tasks per agent |
| `A2A_ROUTER_DISCOVERY_CACHE_TTL_SECONDS` | `300` | Agent Card cache TTL |
| `A2A_ROUTER_AGENT_CARD_SIGNING_KEY` | *(required)* | Ed25519 signing key for Agent Cards |

### 5.15 Agent Identity

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENT_KEYPAIR_ALGORITHM` | `Ed25519` | Keypair algorithm |
| `AGENT_TOKEN_TTL_HOURS` | `24` | Agent JWT TTL |
| `AGENT_SUFFIX_REQUIRED` | `true` | Enforce `(ai)` suffix (always true in production) |

### 5.16 AI / LLM

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `ollama` | LLM provider: ollama, openai |
| `LLM_MODEL` | `llama3.1:70b` | Model name |
| `LLM_BASE_URL` | `http://localhost:11434` | LLM API base URL |
| `LLM_API_KEY` | *(optional)* | LLM API key (required for cloud providers) |
| `OPENAI_API_KEY` | *(optional)* | OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o` | OpenAI model name |

### 5.17 Monitoring

| Variable | Default | Description |
|----------|---------|-------------|
| `PROMETHEUS_PORT` | `9090` | Prometheus port |
| `GRAFANA_PORT` | `3001` | Grafana port |
| `GRAFANA_ADMIN_PASSWORD` | *(required in production)* | Grafana admin password |
| `LOKI_PORT` | `3100` | Loki port |

### 5.18 Production Checklist

Before deploying to any non-local environment, verify:

- [ ] All `*(required)*` variables are set with cryptographically random values
- [ ] `NODE_ENV` is set to `production` or `staging`
- [ ] `WEBAUTHN_RP_ID` matches the actual domain
- [ ] `WEBAUTHN_ORIGIN` uses `https://` scheme
- [ ] `TRAEFIK_DASHBOARD` is set to `false`
- [ ] `TRAEFIK_LOG_LEVEL` is `WARN` or `INFO`
- [ ] `AGENT_SUFFIX_REQUIRED` is `true`
- [ ] `MINIO_USE_SSL` is `true` if MinIO is not on the same Docker network
- [ ] Default passwords (`kalen_dev`, `admin`, `devkey`, `devsecret`) are replaced
- [ ] `.env` file is not committed to version control

---

## 6. Scaling Guidelines

**Status: 📋 Planned — not yet tested**

### 6.1 Vertical Scaling

| Resource | When to Scale | How |
|----------|--------------|-----|
| PostgreSQL | Slow queries, high CPU | Increase `shared_buffers`, `work_mem`; add CPU/memory to pod |
| Redis | High eviction rate, memory pressure | Increase `maxmemory`; add memory to pod |
| Elasticsearch | Slow search, high heap usage | Increase `ES_JAVA_OPTS` heap; add CPU/memory |
| LiveKit | Poor call quality | Add CPU; ensure adequate UDP port range |

### 6.2 Horizontal Scaling

| Service | How | Constraints |
|---------|-----|-------------|
| API Server | Add replicas (HPA) | Stateless; sessions in Redis; WebSocket connections need sticky sessions |
| Web Client | Add replicas | Static assets; no state |
| Identity Service | Add replicas | Stateless; credentials in PostgreSQL |
| NATS | Add to cluster | JetStream replicated across nodes |
| LiveKit | Add SFU instances | Each instance handles a set of rooms; room distribution via Traefik |

### 6.3 Capacity Planning (Estimates)

These are **engineering targets**, not measured results:

| Users | Agents | API Replicas | PostgreSQL | Redis | Notes |
|-------|--------|-------------|-----------|-------|-------|
| 100 | 10 | 2 | 1 vCPU, 2GB | 512MB | Small team |
| 1,000 | 100 | 3 | 2 vCPU, 4GB | 1GB | Medium org |
| 10,000 | 1,000 | 6 | 4 vCPU, 8GB | 2GB | Large org |
| 100,000 | 10,000 | 10+ | 8 vCPU, 16GB + read replicas | 4GB cluster | Enterprise |

---

## 7. Backup and Recovery

**Status: 📋 Planned — not yet implemented or tested**

### 7.1 PostgreSQL Backup

```bash
# Manual backup
docker exec kalen-postgres pg_dump -U kalen kalen > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup (planned cron)
# 0 * * * * docker exec kalen-postgres pg_dump -U kalen kalen | gzip > /backups/kalen_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz

# Restore from backup
gunzip -c backup_20260609_120000.sql.gz | docker exec -i kalen-postgres psql -U kalen kalen
```

**Planned:**
- Hourly pg_dump with gzip compression
- Retention: 7 days hourly, 4 weeks daily, 12 months weekly
- Off-site backup to S3-compatible storage via Restic
- Backup verification: weekly restore test to a temporary database

### 7.2 Redis Backup

Redis uses RDB snapshots with default configuration. For production:

```bash
# Trigger manual save
docker exec kalen-redis redis-cli -a ${REDIS_PASSWORD} BGSAVE

# Copy RDB file
docker cp kalen-redis:/data/dump.rdb ./redis_backup_$(date +%Y%m%d).rdb
```

**Note:** Redis data is primarily cache and session state. Loss is acceptable — sessions will re-authenticate, caches will rebuild. Do not treat Redis as a primary data store.

### 7.3 MinIO Backup

```bash
# Mirror bucket to another MinIO instance or S3
mc mirror local/kalen-files s3-backup/kalen-files-backup

# Or use mc admin backup
mc admin backup local /backups/minio-backup-$(date +%Y%m%d).zip
```

### 7.4 Elasticsearch Backup

```bash
# Create snapshot repository
curl -X PUT "localhost:9200/_snapshot/kalen_backup" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/backups/es"
  }
}'

# Create snapshot
curl -X PUT "localhost:9200/_snapshot/kalen_backup/snapshot_$(date +%Y%m%d)?wait_for_completion=true"
```

### 7.5 Full Disaster Recovery Procedure (Planned)

1. **Assess the situation** — What failed? Is data lost?
2. **Stop application services** — Prevent writes during recovery
3. **Restore PostgreSQL** — From most recent backup
4. **Restore MinIO** — From mirror or backup
5. **Rebuild Elasticsearch index** — From PostgreSQL data (re-index)
6. **Clear Redis** — It will rebuild from fresh data
7. **Start application services** — Verify health checks pass
8. **Validate** — Check message delivery, search, file access

**Recovery targets:**
- RPO (Recovery Point Objective): 1 hour
- RTO (Recovery Time Objective): 15 minutes

---

## 8. Monitoring Setup

**Status: ✅ Partial — Prometheus, Grafana, and Loki configs exist; dashboards and alerts are planned**

### 8.1 Current Monitoring Stack

The Docker Compose development stack includes:

| Service | Port | Purpose |
|---------|------|---------|
| Prometheus | 9090 | Metrics scraping and storage |
| Grafana | 3001 | Dashboard visualization |
| Loki | 3100 | Log aggregation |

**What works:**
- Prometheus scrapes configured targets (kalen-server, LiveKit, NATS, postgres-exporter)
- Grafana has Prometheus and Loki datasources provisioned
- Dashboard provider is configured

**What doesn't exist yet:**
- Dashboard JSON files (kalen-overview, messaging-metrics, agent-activity)
- Alert rules (high latency, low uptime, security anomalies)
- Loki pipeline configuration for structured log parsing
- Distributed tracing (Jaeger or Tempo)

### 8.2 Prometheus Configuration

The existing `prometheus.yml` scrapes:

```yaml
scrape_configs:
  - job_name: "kalen-server"
    static_configs:
      - targets: ["host.docker.internal:4000"]
    metrics_path: /metrics

  - job_name: "livekit"
    static_configs:
      - targets: ["livekit:7880"]

  - job_name: "nats"
    static_configs:
      - targets: ["nats:8222"]

  - job_name: "postgres-exporter"
    static_configs:
      - targets: ["postgres-exporter:9187"]
```

**Note:** The `postgres-exporter` target references a service that is not in the Docker Compose file yet. It needs to be added.

### 8.3 Planned Dashboards

| Dashboard | Panels | Description |
|-----------|--------|-------------|
| **KALEN Overview** | Request rate, error rate, latency p50/p95/p99, active connections, CPU/memory | System health at a glance |
| **Messaging Metrics** | Message throughput, delivery latency, WebSocket connections, search latency | Messaging pipeline health |
| **Agent Activity** | Active agents, MCP tool invocations, A2A tasks, rate limit hits, scope violations | Agent ecosystem health |

### 8.4 Planned Alert Rules

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| HighAPILatency | p95 latency > 2s for 5 minutes | Warning | Investigate slow queries |
| APIErrorRateSpike | 5xx rate > 1% for 5 minutes | Critical | Check logs, potential incident |
| DatabaseConnectionPoolExhausted | Available connections < 5 | Critical | Scale or optimize queries |
| RedisMemoryHigh | Used memory > 90% of maxmemory | Warning | Increase maxmemory or optimize |
| AgentScopeViolationRate | > 10 scope violations in 5 minutes | Critical | Investigate compromised agent |
| CertificateExpiry | TLS cert expires in < 14 days | Warning | Renew certificate |

### 8.5 Structured Logging (Planned)

All application services will emit structured JSON logs:

```json
{
  "timestamp": "2026-06-09T12:00:00.000Z",
  "level": "info",
  "service": "kalen-server",
  "traceId": "uuid",
  "spanId": "uuid",
  "method": "POST",
  "path": "/api/v1/auth/login-finish",
  "statusCode": 200,
  "durationMs": 142,
  "entityType": "human",
  "message": "Authentication successful"
}
```

Logs are shipped to Loki via Promtail (planned) and queryable in Grafana with LogQL.

---

## 9. Troubleshooting

### 9.1 Common Issues

#### PostgreSQL won't start

```bash
# Check if data volume is corrupted
docker compose -f infra/docker/docker-compose.yml logs postgres

# Reset (DESTROYS ALL DATA)
docker compose -f infra/docker/docker-compose.yml down -v
docker compose -f infra/docker/docker-compose.yml up -d postgres
```

#### Redis connection refused

```bash
# Check if Redis is running
docker compose -f infra/docker/docker-compose.yml ps redis

# Test connection
docker exec kalen-redis redis-cli -a kalen_dev ping
```

#### MinIO bucket doesn't exist

```bash
# Create the bucket manually
docker exec kalen-minio mc alias set local http://localhost:9000 kalen_dev kalen_dev_secret
docker exec kalen-minio mc mb local/kalen-files
```

#### Elasticsearch won't start (memory error)

```bash
# Increase virtual memory on the host
sudo sysctl -w vm.max_map_count=262144

# Make it persistent
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

#### Traefik can't route to services

```bash
# Check Traefik logs
docker compose -f infra/docker/docker-compose.yml logs traefik

# Verify Docker provider is working
curl http://localhost:8080/api/http/routers
```

### 9.2 Health Check Endpoints (Planned)

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| API Server | `GET /health` | `{"status": "ok"}` |
| API Server (ready) | `GET /health/ready` | `{"status": "ready"}` |
| PostgreSQL | `pg_isready -U kalen` | Exit code 0 |
| Redis | `redis-cli ping` | `PONG` |
| Elasticsearch | `GET /_cluster/health` | `{"status": "green" or "yellow"}` |
| MinIO | `mc ready local` | Exit code 0 |
| NATS | `GET http://localhost:8222/healthz` | `{"status": "ok"}` |

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables set with production values (no defaults)
- [ ] Database migrations tested on a staging copy
- [ ] TLS certificates provisioned or auto-provisioning verified
- [ ] Backup and restore procedure tested
- [ ] Monitoring dashboards and alerts configured
- [ ] Default passwords replaced on all services

### Post-Deployment

- [ ] All health check endpoints returning OK
- [ ] WebAuthn registration and login works with the production domain
- [ ] Agent creation with `(ai)` suffix enforcement works
- [ ] WebSocket connections are stable (no immediate disconnects)
- [ ] TLS certificate is valid (no browser warnings)
- [ ] Grafana dashboards showing metrics
- [ ] Alert rules firing correctly (test with a known condition)
- [ ] Backup cron job is running and producing output
