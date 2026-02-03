$ErrorActionPreference = "Stop"

# Config
$VpsIP = "46.202.147.151"
$VpsUser = "root"  
$VpsPassword = "2705#Data2705"

Write-Host "VPS Deploy Script" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

# SSH commands to execute
$commands = @(
    "cd /var/www/botia",
    "docker-compose down 2>&1 || true",
    "docker rm -f botia-backend botia-postgres botia-redis 2>&1 || true"
)

# Create docker-compose file content using heredoc
$dockerComposeContent = 'version: ''3.8''

services:
  postgres:
    image: postgres:15-alpine
    container_name: botia-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: botia_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: botia-redis
    ports:
      - "6379:6379"
    restart: unless-stopped

  backend:
    image: node:22-alpine
    container_name: botia-backend
    working_dir: /app
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/botia_db
      REDIS_URL: redis://redis:6379
    volumes:
      - .:/app
    command: sh -c "npm ci --omit=dev && node apps/backend/dist/main"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:'

Write-Host "Manual Instructions:" -ForegroundColor Yellow
Write-Host "===================" -ForegroundColor Yellow
Write-Host ""
Write-Host "SSH into the VPS and run these commands:" -ForegroundColor White
Write-Host ""
Write-Host "ssh root@46.202.147.151" -ForegroundColor Green
Write-Host "# Password: 2705#Data2705" -ForegroundColor Green
Write-Host ""
Write-Host "Then paste this:" -ForegroundColor White
Write-Host ""

$script = @"
cd /var/www/botia

docker-compose down 2>&1 || true
docker rm -f botia-backend botia-postgres botia-redis 2>&1 || true

cat > docker-compose.yml << 'EOF'
$dockerComposeContent
EOF

docker-compose up -d
sleep 10
docker-compose ps
docker logs botia-backend | tail -30
"@

Write-Host $script
Write-Host ""
Write-Host "After containers start, test with:" -ForegroundColor White
Write-Host "curl http://localhost:3000/health" -ForegroundColor Green
Write-Host ""
