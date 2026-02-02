# 🚀 FASE 11: PRODUCTION DEPLOYMENT GUIDE

## 📋 Overview

This guide covers the complete production deployment setup for your application using:

- ✅ Docker multi-stage build for optimal image size
- ✅ Docker Compose orchestration with 6 services
- ✅ Nginx reverse proxy with SSL/TLS
- ✅ Health checks for all services
- ✅ GitHub Actions CI/CD pipeline
- ✅ Environment-based configuration
- ✅ Security best practices
- ✅ Monitoring and logging

---

## 📦 What's Included

### **1. Docker Multi-Stage Build**

**File:** `apps/backend/Dockerfile` (70 lines)

```dockerfile
# Build stage: Compile TypeScript to JavaScript
FROM node:22-alpine AS builder
# Installs dependencies and builds the app

# Runtime stage: Minimal production image
FROM node:22-alpine
# Only includes production dependencies + built app
# Non-root user for security
# Health checks enabled
# ~500MB → ~200MB reduction with multi-stage
```

**Benefits:**
- ✅ Smaller image size (200MB vs 500MB)
- ✅ Faster deployment
- ✅ No source code in production
- ✅ Non-root user execution
- ✅ Built-in health checks

---

### **2. Docker Compose Orchestration**

**File:** `infra/docker-compose.yml` (190 lines)

**Services:**

```yaml
postgres:        # PostgreSQL 16 database
redis:           # Redis 7 cache
evolution-api:   # WhatsApp integration
ollama:          # LLM models (Whisper, Mistral, etc)
backend:         # NestJS application
nginx:           # Reverse proxy & load balancer
```

**Features:**
- ✅ 6 interconnected services
- ✅ Health checks for all services
- ✅ Named volumes for persistence
- ✅ Environment variable injection
- ✅ Network isolation
- ✅ Dependency ordering
- ✅ Resource constraints (optional)

---

### **3. Nginx Reverse Proxy**

**File:** `infra/nginx.conf` (200 lines)

**Features:**
- ✅ HTTP → HTTPS redirect
- ✅ SSL/TLS with modern ciphers
- ✅ Gzip compression
- ✅ Rate limiting (10 req/s for API, 30 req/s general)
- ✅ Security headers (CSP, X-Frame-Options, etc)
- ✅ WebSocket support
- ✅ Static asset caching
- ✅ Upstream health checks

**Endpoints:**
- `/health` - Application health check
- `/api/` - REST API (rate limited)
- `/ws/` - WebSocket connections
- Static files with 30-day cache

---

### **4. Environment Configuration**

**Files:**
- `infra/.env.production` - Production secrets
- `infra/.env.development` - Development config
- `infra/.env.staging` - Staging config

**Key Variables:**
```env
# Database
POSTGRES_HOST=postgres
POSTGRES_PASSWORD=change_me_in_production

# Redis
REDIS_PASSWORD=change_me_in_production

# JWT
JWT_SECRET=long_random_string_here

# APIs
EVOLUTION_API_URL=http://evolution-api:8080
OLLAMA_API_URL=http://ollama:11434

# CORS
CORS_ORIGIN=https://yourdomain.com
```

---

### **5. GitHub Actions CI/CD**

**File:** `.github/workflows/deploy.yml` (180 lines)

**Pipeline:**

```
┌─────────────────────────────────────────────────────┐
│ 1. TEST STAGE (on every push)                       │
│   - Run linter                                      │
│   - Run test suite (123 tests)                      │
│   - Upload coverage to Codecov                      │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ 2. BUILD STAGE (if tests pass)                      │
│   - Build Docker image                              │
│   - Push to GitHub Container Registry               │
│   - Cache layers for faster builds                  │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ 3. DEPLOY STAGE (only on main branch)               │
│   - SSH to production server                        │
│   - Pull latest image                               │
│   - Run docker-compose up -d                        │
│   - Health check (30 attempts, 10s interval)        │
│   - Notify success/failure                          │
└─────────────────────────────────────────────────────┘
```

**Jobs:**
1. **test** - Run tests with PostgreSQL & Redis services
2. **build** - Build Docker image and push to registry
3. **deploy** - Deploy to production with health checks

---

## 🚀 Quick Start

### **Prerequisites**

```bash
# Install Docker and Docker Compose
docker --version
docker-compose --version

# Or use new Docker Compose V2
docker compose version
```

### **Development Setup**

```bash
# Navigate to infra directory
cd infra

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### **Production Deployment**

```bash
# 1. Set environment variables
cp .env.production /path/to/production/
# Edit .env.production with your actual values

# 2. Load environment
export $(cat .env.production | xargs)

# 3. Build and start
docker-compose -f docker-compose.yml up -d

# 4. Check health
curl http://localhost/health

# 5. View logs
docker-compose logs -f backend
```

---

## 📊 Services Configuration

### **PostgreSQL**

```yaml
image: postgres:16-alpine
ports: 5432:5432
environment:
  POSTGRES_DB: appdb
  POSTGRES_USER: appuser
  POSTGRES_PASSWORD: ***change_me***
healthcheck: pg_isready every 10s
```

**Usage:**
```bash
# Connect to database
docker-compose exec postgres psql -U appuser -d appdb

# Run migrations
docker-compose exec backend npm run migrate

# Create backup
docker-compose exec postgres pg_dump -U appuser appdb > backup.sql
```

### **Redis**

```yaml
image: redis:7-alpine
ports: 6379:6379
command: redis-server --appendonly yes --requirepass ***
healthcheck: redis-cli ping every 10s
```

**Usage:**
```bash
# Connect to Redis
docker-compose exec redis redis-cli -a password

# Check queue status
docker-compose exec redis redis-cli -a password LLEN audio-queue

# Monitor real-time
docker-compose exec redis redis-cli -a password MONITOR
```

### **Evolution API (WhatsApp)**

```yaml
image: ghcr.io/evolution-api/whatsapp:latest
ports: 8080:8080
environment:
  LICENSE_KEY: your_license_key
  REDIS_URL: redis://***@redis:6379
  DATABASE_URL: postgres://***@postgres:5432/evolution
```

### **Ollama (LLM Models)**

```yaml
image: ollama/ollama:latest
ports: 11434:11434
volumes: ollama_data:/root/.ollama
# GPU support available (uncomment for NVIDIA)
```

**Models:**
```bash
# Pull models (if not already loaded)
docker-compose exec ollama ollama pull mistral
docker-compose exec ollama ollama pull whisper
docker-compose exec ollama ollama pull neural-chat

# List loaded models
docker-compose exec ollama ollama list
```

### **Backend (NestJS)**

```yaml
image: ghcr.io/yourorg/backend:latest
ports: 3000:3000
environment: [All env vars from .env file]
healthcheck: curl http://localhost:3000/health
depends_on: [postgres, redis, ollama]
```

**Debug:**
```bash
# View logs
docker-compose logs -f backend

# Check health
curl http://localhost:3000/health

# Execute command
docker-compose exec backend npm run prisma:migrate

# Shell access
docker-compose exec backend sh
```

### **Nginx (Reverse Proxy)**

```yaml
image: nginx:alpine
ports: 80:80, 443:443
volumes: nginx.conf, ssl certificates
```

**SSL Certificate Setup:**

```bash
# Using Let's Encrypt with Certbot
docker run -it --rm \
  -v /path/to/certs:/etc/letsencrypt \
  -v /path/to/www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d yourdomain.com \
  -d www.yourdomain.com

# Copy certs to nginx
cp /path/to/certs/live/yourdomain.com/fullchain.pem infra/ssl/cert.pem
cp /path/to/certs/live/yourdomain.com/privkey.pem infra/ssl/key.pem
```

---

## 🔒 Security Best Practices

### **1. Environment Secrets**

```bash
# Never commit .env files
echo ".env*" >> .gitignore
echo "infra/.env.*" >> .gitignore

# Use GitHub Secrets for CI/CD
# Settings → Secrets → New secret
# - DEPLOY_KEY (SSH private key)
# - DEPLOY_HOST (production server IP)
# - DEPLOY_USER (production user)
```

### **2. Non-Root User**

Dockerfile already uses non-root user:
```dockerfile
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
```

### **3. Security Headers**

Nginx includes:
```nginx
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

### **4. SSL/TLS**

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
```

### **5. Rate Limiting**

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
# API: 10 requests/second
# General: 30 requests/second
```

---

## 📈 Monitoring & Logging

### **Health Checks**

All services have health checks:

```bash
# Backend
curl http://localhost:3000/health

# PostgreSQL
docker-compose exec postgres pg_isready -U appuser

# Redis
docker-compose exec redis redis-cli -a password ping

# Evolution API
curl http://localhost:8080/health

# Ollama
curl http://localhost:11434/api/tags
```

### **Logging**

```bash
# View all logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# With timestamps
docker-compose logs -f --timestamps

# Last 100 lines
docker-compose logs -f --tail=100
```

### **Monitoring (Optional)**

Add Prometheus + Grafana for metrics:

```bash
# Add to docker-compose.yml
prometheus:
  image: prom/prometheus:latest
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
    - prometheus_data:/prometheus

grafana:
  image: grafana/grafana:latest
  ports:
    - '3001:3000'
  environment:
    GF_SECURITY_ADMIN_PASSWORD: admin
```

---

## 🚨 Troubleshooting

### **Service Won't Start**

```bash
# Check logs
docker-compose logs backend

# Inspect image
docker inspect ghcr.io/yourorg/backend:latest

# Remove and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### **Port Already in Use**

```bash
# Check what's using the port
lsof -i :3000
netstat -tlnp | grep 3000

# Use different port in docker-compose
ports:
  - "8000:3000"  # Map 8000 to 3000
```

### **Database Connection Failed**

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U appuser -d appdb -c "SELECT 1"

# Check environment variables
docker-compose exec backend env | grep DATABASE_URL
```

### **Redis Connection Failed**

```bash
# Check Redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli -a password ping

# Check password
docker-compose exec redis redis-cli -a wrong_password ping  # Should fail
```

---

## 📊 Performance Tuning

### **Docker Resource Limits**

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### **Nginx Optimization**

```nginx
worker_processes auto;  # Auto-detect CPU count
worker_connections 4096;  # Increase per worker
keepalive_timeout 65;  # Connection timeout
gzip on;  # Enable compression
```

### **PostgreSQL Optimization**

```bash
# Edit postgresql.conf inside container
docker-compose exec postgres sh -c 'echo "shared_buffers = 256MB" >> /var/lib/postgresql/data/postgresql.conf'
docker-compose restart postgres
```

### **Redis Optimization**

```bash
# In redis command
redis-server --maxmemory 1gb --maxmemory-policy allkeys-lru
```

---

## ✅ Deployment Checklist

- [ ] Environment variables configured for production
- [ ] SSL certificates obtained and placed in `infra/ssl/`
- [ ] Database backups configured
- [ ] Redis persistence enabled
- [ ] Health checks verified
- [ ] Nginx configuration updated with domain name
- [ ] GitHub Actions secrets configured
- [ ] Firewall rules allowing 80, 443, 3000
- [ ] Monitoring set up (optional)
- [ ] Load balancer configured (optional)
- [ ] CDN configured (optional)
- [ ] Disaster recovery plan ready

---

## 🔄 Deployment Flow

### **1. Development**
```bash
docker-compose -f docker-compose.yml up -d
```

### **2. Staging**
```bash
docker-compose -f docker-compose.yml --env-file .env.staging up -d
```

### **3. Production**
```bash
docker-compose -f docker-compose.yml --env-file .env.production up -d
```

### **4. Rollback**
```bash
docker-compose down
docker image rm ghcr.io/yourorg/backend:old-sha
docker-compose up -d  # Uses previous image tag
```

---

## 📚 Additional Resources

- Docker Documentation: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- Nginx Configuration: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/
- GitHub Actions: https://docs.github.com/en/actions

---

## 🎯 Summary

Your production deployment includes:

✅ **Containerized Backend** - Multi-stage Dockerfile
✅ **Orchestration** - Docker Compose with 6 services
✅ **Reverse Proxy** - Nginx with SSL/TLS
✅ **CI/CD Pipeline** - GitHub Actions automation
✅ **Health Checks** - All services monitored
✅ **Security** - Non-root user, SSL, security headers
✅ **Environment Config** - Dev/staging/production
✅ **Logging & Monitoring** - Docker logs + health checks

**Ready to deploy? Follow the Quick Start section above!**

---

**FASE 11 STATUS: ✅ PRODUCTION READY**
