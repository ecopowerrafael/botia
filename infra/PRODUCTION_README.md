# 🚀 Production Deployment - Quick Reference

## 📦 Service Stack

```
┌──────────────────────────────────────────────────────────┐
│                    NGINX (Reverse Proxy)                 │
│                    :80 :443 (SSL/TLS)                   │
└────────────────────────────┬─────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
    ┌───▼────────────┐  ┌────▼────────────┐  ┌──▼──────────────┐
    │   NestJS       │  │   WebSocket      │  │  Static Assets  │
    │   Backend      │  │   /ws/*          │  │  /public/*      │
    │   :3000        │  │                  │  │                 │
    └────┬──────────┬┘  └────────────────┘  └─────────────────┘
         │          │
    ┌────▼──┐  ┌───▼────┐  ┌──────────┐  ┌─────────────┐
    │  PostgreSQL  │ Redis  │ Ollama   │  │ Evolution   │
    │  Database   │ Cache  │  LLM     │  │ WhatsApp    │
    │  :5432      │ :6379  │ :11434   │  │ :8080       │
    └────────┘  └────────┘ └──────────┘  └─────────────┘
```

---

## 🚀 Deploy in 3 Steps

### **1. Setup Environment**
```bash
# Copy production config
cp infra/.env.production infra/.env
# Edit with your actual values
nano infra/.env
```

### **2. Start Services**
```bash
cd infra
docker-compose up -d
```

### **3. Verify Health**
```bash
# Check all services
docker-compose ps

# Test health endpoint
curl http://localhost/health
```

---

## 🔑 Environment Variables

### Required
```env
POSTGRES_PASSWORD=strong_password_here
REDIS_PASSWORD=strong_password_here
JWT_SECRET=long_random_string_minimum_32_chars
```

### Optional (highly recommended)
```env
EVOLUTION_LICENSE_KEY=your_license
SMTP_PASSWORD=your_email_password
GOOGLE_API_KEY=your_google_api_key
OPENAI_API_KEY=your_openai_api_key
```

---

## 📊 Service Ports

| Service | Port | Protocol |
|---------|------|----------|
| Nginx HTTP | 80 | HTTP |
| Nginx HTTPS | 443 | HTTPS |
| Backend API | 3000 | HTTP |
| PostgreSQL | 5432 | TCP |
| Redis | 6379 | TCP |
| Ollama | 11434 | HTTP |
| Evolution API | 8080 | HTTP |

---

## 🔐 SSL/TLS Setup

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com

# Copy to Nginx
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem infra/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem infra/ssl/key.pem

# Restart Nginx
docker-compose restart nginx
```

### Auto-Renewal

```bash
# Add to crontab (renew every 60 days)
0 2 * * * certbot renew --quiet && \
  cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem infra/ssl/cert.pem && \
  cp /etc/letsencrypt/live/yourdomain.com/privkey.pem infra/ssl/key.pem && \
  docker-compose restart nginx
```

---

## 📈 Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Database Management
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U appuser -d appdb

# Run migrations
docker-compose exec backend npm run migrate

# Backup database
docker-compose exec postgres pg_dump -U appuser appdb > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U appuser appdb < backup.sql
```

### Redis Management
```bash
# Access Redis
docker-compose exec redis redis-cli -a password

# Check queue lengths
docker-compose exec redis redis-cli -a password LLEN audio-queue
docker-compose exec redis redis-cli -a password LLEN notification-queue

# Monitor real-time
docker-compose exec redis redis-cli -a password MONITOR

# Clear all data (use with caution!)
docker-compose exec redis redis-cli -a password FLUSHALL
```

### Service Control
```bash
# Stop services
docker-compose stop

# Start services
docker-compose start

# Restart specific service
docker-compose restart backend

# Remove all (including volumes!)
docker-compose down -v
```

---

## 🔍 Health Checks

### Test Endpoints
```bash
# Backend health
curl http://localhost/health

# PostgreSQL
docker-compose exec postgres pg_isready -U appuser

# Redis
docker-compose exec redis redis-cli -a password ping

# Ollama
curl http://localhost:11434/api/tags

# Evolution API
curl http://localhost:8080/health
```

### Check Service Status
```bash
# List all containers
docker-compose ps

# Inspect specific service
docker-compose exec backend curl http://localhost:3000/queue/status
```

---

## 🚨 Troubleshooting

### Connection Issues
```bash
# Check if port is accessible
nc -zv localhost 3000
curl -v http://localhost:3000/health

# Check firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Database Issues
```bash
# Check logs
docker-compose logs postgres

# Verify connection
docker-compose exec postgres psql -U appuser -d appdb -c "SELECT 1"

# Check disk space
docker system df
```

### Memory Issues
```bash
# Check container stats
docker stats

# Set memory limits
docker-compose down
# Edit docker-compose.yml, add:
# deploy:
#   resources:
#     limits:
#       memory: 2G
docker-compose up -d
```

---

## 📊 Monitoring

### Queue Status
```bash
# Check all queues
curl http://localhost/api/queue/status

# Check specific job
curl http://localhost/api/queue/job/audio/job-id

# Scheduled jobs
curl http://localhost/api/queue/scheduled-jobs
```

### Performance Metrics
```bash
# Container resource usage
docker stats

# Network traffic
docker-compose exec backend curl http://localhost:3000/health -v
```

---

## 🔄 Updates & Rollbacks

### Pull Latest Image
```bash
docker-compose pull backend
docker-compose up -d backend
```

### Rollback to Previous Version
```bash
# View image history
docker images

# Use specific tag
docker-compose down
# Edit docker-compose.yml, change image tag
docker-compose up -d
```

---

## 🔐 Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Enable SSL/TLS with valid certificate
- [ ] Disable HTTP (redirect to HTTPS only)
- [ ] Set strong `JWT_SECRET`
- [ ] Configure firewall rules
- [ ] Enable database backups
- [ ] Setup rate limiting
- [ ] Monitor error logs
- [ ] Regular security updates
- [ ] Setup monitoring/alerting

---

## 📞 Support & Monitoring

### Enable Detailed Logging
```env
LOG_LEVEL=debug
NODE_ENV=production
```

### Setup Error Tracking (Optional)
```env
SENTRY_DSN=https://your-sentry-dsn
```

### Health Alerts (Optional)
```bash
# Add health check monitoring
while true; do
  if ! curl -f http://localhost/health > /dev/null 2>&1; then
    echo "Application health check failed!"
    # Send alert (email, Slack, etc)
  fi
  sleep 60
done
```

---

## 📚 Documentation

- Full guide: [FASE11_DEPLOYMENT_GUIDE.md](./FASE11_DEPLOYMENT_GUIDE.md)
- Testing guide: [FASE10_TESTING_GUIDE.md](./FASE10_TESTING_GUIDE.md)
- API documentation: [README.md](./README.md)

---

## 🎯 Next Steps

1. **Monitor Performance**
   - Setup Prometheus + Grafana
   - Configure alerts for anomalies

2. **Optimize Costs**
   - Review resource limits
   - Optimize database queries
   - Enable image layer caching

3. **Scale Horizontally**
   - Deploy multiple backend instances
   - Use load balancer
   - Configure auto-scaling

4. **Enhance Security**
   - Implement WAF rules
   - Setup DDoS protection
   - Enable audit logging

---

**Production deployment complete! 🚀**

For detailed information, see [FASE11_DEPLOYMENT_GUIDE.md](./FASE11_DEPLOYMENT_GUIDE.md)
