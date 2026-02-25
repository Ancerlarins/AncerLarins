# AncerLarins — Deployment Guide

## Prerequisites

- **Docker** >= 24.0 and **Docker Compose** >= 2.20
- A server with at least **2 GB RAM** and **20 GB disk** (4 GB RAM recommended)
- A registered **domain name** with DNS A record pointing to your server IP
- Ports **80** and **443** open for HTTP/HTTPS traffic
- Port **3001** open if you want external access to Grafana (optional)

---

## 1. Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-org/ancerlarins.git
cd ancerlarins

# Copy the environment file
cp deployment/docker/.env.example deployment/docker/.env

# Edit the environment file with your values
nano deployment/docker/.env
```

---

## 2. Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_PASSWORD` | PostgreSQL password | `strong_random_password_here` |
| `REDIS_PASSWORD` | Redis password | `strong_random_password_here` |
| `APP_KEY` | Laravel app key (generate with `php artisan key:generate --show`) | `base64:...` |
| `APP_URL` | Full public URL | `https://ancerlarins.com` |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | `https://ancerlarins.com/api/v1` |
| `GRAFANA_ADMIN_PASSWORD` | Grafana admin password | `strong_random_password_here` |

### Required for Features

| Variable | Description |
|----------|-------------|
| `TERMII_API_KEY` | SMS/OTP delivery via Termii |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` | Payment processing |
| `CLOUDINARY_URL` | Image uploads |
| `SENTRY_LARAVEL_DSN` | Error tracking |
| `MAIL_*` | Email delivery (SMTP) |

### Secrets Management

- Never commit `.env` files to version control
- Use strong, unique passwords for `DB_PASSWORD`, `REDIS_PASSWORD`, and `GRAFANA_ADMIN_PASSWORD`
- Rotate `APP_KEY` only if you understand the implications (encrypted data becomes unreadable)

---

## 3. SSL Certificate Setup

SSL must be initialized **before** starting the full stack:

```bash
cd deployment/docker

# Run the SSL initialization script
# This obtains a Let's Encrypt certificate for your domain
chmod +x init-ssl.sh
./init-ssl.sh
```

The `certbot` service handles automatic renewal every 12 hours.

**For local/staging without SSL:** Comment out the SSL-related lines in `nginx.conf` and use HTTP only.

---

## 4. Deploy

```bash
cd deployment/docker

# Build and start all services
docker compose up -d --build

# Verify all services are running
docker compose ps

# Check backend logs for migration output
docker compose logs backend --tail=50
```

### What Happens on First Start

1. PostgreSQL and Redis start first (with health checks)
2. Backend container runs `php artisan migrate --force`, caches config/routes/views, then starts PHP-FPM
3. Frontend builds and starts the Next.js server
4. Nginx starts as the reverse proxy
5. Monitoring stack (Prometheus, Grafana, exporters) starts
6. Log aggregation (Loki, Promtail) starts
7. Backup service runs an initial database backup

---

## 5. Update / Redeploy

```bash
cd deployment/docker

# Pull latest code
git pull origin main

# Rebuild and restart (zero-downtime for stateless services)
docker compose up -d --build

# If you need to run new migrations manually:
docker compose exec backend php artisan migrate --force

# Clear caches after code changes:
docker compose exec backend php artisan config:cache
docker compose exec backend php artisan route:cache
docker compose exec backend php artisan view:cache
```

### Rolling Restarts

To minimize downtime, restart services individually:

```bash
# Rebuild and restart just the backend
docker compose up -d --build --no-deps backend worker scheduler

# Rebuild and restart just the frontend
docker compose up -d --build --no-deps frontend
```

---

## 6. Database Backup & Restore

### Automatic Backups

The `backup` service runs `pg_dump` daily and retains backups for 7 days. Backups are stored in the `db_backups` Docker volume.

### Manual Backup

```bash
# Create an on-demand backup
docker compose exec backup /usr/local/bin/backup-db.sh

# Copy backup to host
docker compose cp backup:/backups/. ./backups/
```

### Restore from Backup

```bash
# List available backups
docker compose exec backup ls -la /backups/

# Restore a specific backup
docker compose exec -T postgres psql -U ancerlarins -d ancerlarins < backup_file.sql

# Or from a gzipped backup
gunzip -c backup_file.sql.gz | docker compose exec -T postgres psql -U ancerlarins -d ancerlarins
```

---

## 7. Monitoring

### Accessing Grafana

- **URL**: `http://your-server:3001` (or the port set in `GRAFANA_PORT`)
- **Login**: `admin` / value of `GRAFANA_ADMIN_PASSWORD`
- **Default dashboard**: "AncerLarins Overview" (auto-provisioned)

### Dashboard Panels

The pre-built dashboard includes:

| Panel | Source | What It Shows |
|-------|--------|---------------|
| Application Status | Laravel `/metrics` | Whether Laravel is responding |
| Queue Depth | Laravel `/metrics` | Jobs waiting in the default queue |
| Active DB Connections | Laravel `/metrics` | PostgreSQL active connections |
| Redis Memory / Hit Rate | Redis Exporter | Memory usage and cache effectiveness |
| Nginx Connections | Nginx Exporter | Active connections and request rate |
| PostgreSQL Rows/s | Postgres Exporter | Database read throughput |
| Database Size | Postgres Exporter | Total database size on disk |

### Health Check Endpoints

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /health` (nginx) | None | Load balancer probe — returns `200 "ok"` |
| `GET /api/v1/health` | None (rate-limited) | Laravel liveness — proves PHP-FPM is alive |
| `GET /api/v1/health/deep` | Admin (Sanctum) | Readiness — checks DB, Redis, storage, queue |

### Setting Up Alerts

In Grafana, navigate to **Alerting > Alert rules** and create rules for:

- Queue depth > 100 for 5 minutes (jobs backing up)
- Active DB connections > 80 (approaching limits)
- `laravel_up` = 0 (application down)
- Redis memory > 80% of available

---

## 8. Log Management

### Querying Logs

1. Open Grafana → **Explore** (compass icon)
2. Select **Loki** as the datasource
3. Use LogQL queries:

```logql
# All backend logs
{service="backend"}

# Error-level logs only
{service="backend"} |= "ERROR"

# Worker logs (queue processing)
{service="worker"}

# Nginx access logs
{service="nginx"}

# All logs from the last hour containing "failed"
{project="docker"} |= "failed"
```

### Log Retention

Loki retains logs for **7 days** (configured in `loki.yml`). To change:

```yaml
# In deployment/docker/loki.yml
limits_config:
  retention_period: 336h  # 14 days
```

Restart Loki after changes: `docker compose restart loki`

---

## 9. Scaling

### Queue Workers

Increase workers to handle higher job throughput:

```bash
docker compose up -d --scale worker=3
```

### Frontend Replicas

Run multiple frontend instances behind nginx:

```bash
docker compose up -d --scale frontend=2
```

Nginx upstream automatically load-balances across instances when using Docker's built-in DNS.

### Database Connections

If scaling workers/backends, increase PostgreSQL's `max_connections` in the postgres service:

```yaml
# docker-compose.yml postgres service
command: postgres -c max_connections=200
```

---

## 10. Troubleshooting

### Container Keeps Restarting

```bash
# Check logs for the failing container
docker compose logs backend --tail=100
docker compose logs worker --tail=100

# Common causes:
# - Missing or invalid .env values
# - Database migration failure
# - Redis connection refused (wrong password)
```

### Database Connection Failures

```bash
# Verify PostgreSQL is healthy
docker compose exec postgres pg_isready -U ancerlarins

# Check if backend can reach postgres
docker compose exec backend php artisan tinker --execute="DB::connection()->getPdo(); echo 'OK';"

# Reset database (DESTRUCTIVE — drops all data)
# docker compose exec backend php artisan migrate:fresh --seed --force
```

### Queue Jobs Not Processing

```bash
# Check worker is running
docker compose ps worker

# Check queue size
docker compose exec backend php artisan queue:monitor default

# Restart workers
docker compose restart worker

# Process failed jobs
docker compose exec backend php artisan queue:retry all
```

### Redis Connection Issues

```bash
# Test Redis connectivity
docker compose exec redis redis-cli -a $REDIS_PASSWORD ping

# Flush Redis cache (non-destructive to data, clears cache only)
docker compose exec backend php artisan cache:clear
```

### Monitoring Not Working

```bash
# Check Prometheus targets
# Visit http://your-server:9090/targets (if port is exposed)
# Or check from inside the network:
docker compose exec prometheus wget -qO- http://localhost:9090/api/v1/targets | head

# Check Grafana logs
docker compose logs grafana --tail=50

# Restart monitoring stack
docker compose restart prometheus grafana nginx-exporter postgres-exporter redis-exporter
```

### Logs Not Appearing in Grafana

```bash
# Check Promtail is running and connected to Loki
docker compose logs promtail --tail=50

# Check Loki is receiving data
docker compose logs loki --tail=50

# Verify Docker socket is accessible
docker compose exec promtail ls -la /var/run/docker.sock
```

---

## Service Architecture

```
                         ┌──────────┐
                         │  Client  │
                         └────┬─────┘
                              │ :80/:443
                         ┌────▼─────┐
                         │  Nginx   │──── /health (liveness)
                         └────┬─────┘     /nginx_status (metrics)
                     ┌────────┼────────┐
                     │        │        │
              /api/* │        │ /*     │ static
                     │        │        │
               ┌─────▼──┐ ┌──▼────┐   │
               │Backend │ │Frontend│   │
               │PHP-FPM │ │Next.js │   │
               └───┬────┘ └───────┘   │
                   │                   │
          ┌────────┼────────┐          │
          │        │        │          │
    ┌─────▼──┐ ┌───▼──┐ ┌──▼─────┐   │
    │Postgres│ │Redis │ │Storage │   │
    └────────┘ └──────┘ └────────┘   │
                                      │
    ┌─────────┐ ┌──────────┐ ┌───────┐
    │Worker(s)│ │Scheduler │ │Backup │
    └─────────┘ └──────────┘ └───────┘

    ┌──────────── Monitoring ───────────┐
    │ Prometheus ← Exporters (nginx,    │
    │              postgres, redis)     │
    │ Grafana → Prometheus + Loki       │
    │ Promtail → Loki (log aggregation) │
    └───────────────────────────────────┘
```
