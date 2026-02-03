# Script para atualizar Evolution API e reiniciar servicos no VPS
param(
    [string]$VPS_IP = "46.202.147.151",
    [string]$VPS_USER = "appuser"
)

Write-Host "Atualizando Evolution API no VPS..." -ForegroundColor Cyan

# 1. Conectar ao VPS e parar servicos
Write-Host "Parando containers..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_IP" "cd ~/apps/seu-projeto/infra; docker-compose down"

# 2. Atualizar docker-compose.yml
Write-Host "Atualizando imagem do Evolution API..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_IP" "cd ~/apps/seu-projeto/infra; sed -i 's|image: ghcr.io/evolution-api/whatsapp:latest|image: evoapicloud/evolution-api:latest|g' docker-compose.yml; sed -i 's|image: evoluapi/evolution-api:latest|image: evoapicloud/evolution-api:latest|g' docker-compose.yml"

# 3. Iniciar novamente
Write-Host "Iniciando containers..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_IP" "cd ~/apps/seu-projeto/infra; docker-compose up -d"

# 4. Aguardar estabilizacao
Write-Host "Aguardando 15 segundos para estabilizacao..." -ForegroundColor Magenta
Start-Sleep -Seconds 15

# 5. Verificar status
Write-Host "Status dos containers:" -ForegroundColor Green
ssh "$VPS_USER@$VPS_IP" "cd ~/apps/seu-projeto/infra; docker-compose ps"

# 6. Testar health check
Write-Host "Testando endpoints..." -ForegroundColor Cyan
ssh "$VPS_USER@$VPS_IP" "echo Backend health:; curl -s http://localhost:3000/health | head -c 100"

Write-Host "Atualizacao completa! Acesse: http://46.202.147.151" -ForegroundColor Green
