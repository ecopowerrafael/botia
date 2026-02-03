# PowerShell script to deploy on VPS

$host_ip = "46.202.147.151"
$user = "root"
$password = "2705#Data2705"

# Convert password to secure string
$secPass = ConvertTo-SecureString -String $password -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential ($user, $secPass)

Write-Host "=========================================="
Write-Host "VPS Deploy - PowerShell SSH"
Write-Host "=========================================="

# Docker compose content
$dockerCompose = @'
version: '3.8'

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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: botia-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
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
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - .:/app
    command: sh -c "npm ci --omit=dev && npm run prisma:migrate 2>&1 || true && node apps/backend/dist/main"
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
'@

Write-Host "`n[1] Creating SSH session..."
try {
    $session = New-PSSession -HostName $host_ip -UserName $user -Password $secPass -ErrorAction Stop
    Write-Host "✓ Connected!"
} catch {
    Write-Host "❌ Connection failed: $_"
    Write-Host "`nPlease ensure you have SSH enabled on Windows and OpenSSH installed."
    exit 1
}

Write-Host "`n[2] Stopping old containers..."
Invoke-Command -Session $session -ScriptBlock {
    cd /var/www/botia
    docker-compose down 2>&1 || $true
    docker rm -f botia-backend botia-postgres botia-redis 2>&1 || $true
}

Write-Host "`n[3] Creating docker-compose.yml..."
Invoke-Command -Session $session -ScriptBlock {
    cd /var/www/botia
    $content = @"
$using:dockerCompose
"@
    Set-Content -Path docker-compose.yml -Value $content
} 

Write-Host "`n[4] Starting containers..."
Invoke-Command -Session $session -ScriptBlock {
    cd /var/www/botia
    docker-compose up -d
    Start-Sleep -Seconds 5
}

Write-Host "`n[5] Container status..."
Invoke-Command -Session $session -ScriptBlock {
    cd /var/www/botia
    docker-compose ps
}

Write-Host "`n[6] Backend logs..."
Invoke-Command -Session $session -ScriptBlock {
    docker logs botia-backend 2>&1 | Select-Object -Last 20
}

Write-Host "`n=========================================="
Write-Host "Deploy completed!"
Write-Host "=========================================="

Remove-PSSession -Session $session
