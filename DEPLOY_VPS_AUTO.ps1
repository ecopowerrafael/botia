# ============================================
# DEPLOY AUTOMÁTICO PARA VPS
# Versão: 1.0
# Data: 2026-02-02
# ============================================

# Configurações
$VPS_HOST = "172.104.71.250"
$VPS_USER = "root"
$SSH_KEY = "C:\Users\Code\.ssh\linode_vps"
$APP_PATH = "/app"
$LOCAL_PATH = "c:\Users\Code\OneDrive\Desktop\bot ia"

Write-Host "====== DEPLOY AUTOMÁTICO VPS =======" -ForegroundColor Cyan
Write-Host "VPS: $VPS_HOST" -ForegroundColor Yellow
Write-Host "Caminho: $APP_PATH" -ForegroundColor Yellow
Write-Host ""

# ============================================
# ETAPA 1: Verificar SSH
# ============================================
Write-Host "[1/6] Verificando conectividade SSH..." -ForegroundColor Green
try {
    $null = ssh -i $SSH_KEY -o ConnectTimeout=5 "$VPS_USER@$VPS_HOST" "echo OK"
    Write-Host "✅ SSH conectado" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro SSH: $_" -ForegroundColor Red
    exit 1
}

# ============================================
# ETAPA 2: Backup da aplicação anterior
# ============================================
Write-Host "`n[2/6] Criando backup da aplicação anterior..." -ForegroundColor Green
$BACKUP_TIME = Get-Date -Format "yyyyMMdd_HHmmss"
ssh -i $SSH_KEY "$VPS_USER@$VPS_HOST" "
if [ -d $APP_PATH/apps/backend ]; then
  mkdir -p $APP_PATH/backups
  tar -czf $APP_PATH/backups/backend_$BACKUP_TIME.tar.gz $APP_PATH/apps/backend 2>/dev/null || true
  echo 'Backup criado'
fi
"
Write-Host "✅ Backup realizado" -ForegroundColor Green

# ============================================
# ETAPA 3: Enviar código compilado
# ============================================
Write-Host "`n[3/6] Enviando código compilado para VPS..." -ForegroundColor Green
Write-Host "  → Copiando package.json..." -ForegroundColor Cyan
scp -i $SSH_KEY "$LOCAL_PATH\apps\backend\package.json" "$VPS_USER@$VPS_HOST`:$APP_PATH/apps/backend/" 2>&1 | Select-Object -Last 2
scp -i $SSH_KEY "$LOCAL_PATH\apps\backend\package-lock.json" "$VPS_USER@$VPS_HOST`:$APP_PATH/apps/backend/" 2>&1 | Select-Object -Last 2

Write-Host "  → Copiando código compilado..." -ForegroundColor Cyan
scp -i $SSH_KEY -r "$LOCAL_PATH\apps\backend\dist" "$VPS_USER@$VPS_HOST`:$APP_PATH/apps/backend/" 2>&1 | Select-Object -Last 2

Write-Host "  → Copiando Prisma schema..." -ForegroundColor Cyan
scp -i $SSH_KEY -r "$LOCAL_PATH\prisma" "$VPS_USER@$VPS_HOST`:$APP_PATH/" 2>&1 | Select-Object -Last 2

Write-Host "✅ Código enviado" -ForegroundColor Green

# ============================================
# ETAPA 4: Instalar dependências e migrar BD
# ============================================
Write-Host "`n[4/6] Instalando dependências e migrando banco..." -ForegroundColor Green
ssh -i $SSH_KEY "$VPS_USER@$VPS_HOST" "
cd $APP_PATH/apps/backend

# Instalar apenas dependências de produção
npm ci --omit=dev 2>&1 | tail -5

# Gerar cliente Prisma
npx prisma generate

# Rodar migrações
npx prisma migrate deploy --schema $APP_PATH/prisma/schema.prisma

echo 'Dependências instaladas'
"
Write-Host "✅ Dependências e migrações concluídas" -ForegroundColor Green

# ============================================
# ETAPA 5: Parar e reiniciar Docker Compose
# ============================================
Write-Host "`n[5/6] Reiniciando containers Docker..." -ForegroundColor Green
ssh -i $SSH_KEY "$VPS_USER@$VPS_HOST" "
cd $APP_PATH/infra

# Parar containers antigos
docker-compose down 2>&1 | tail -3

# Iniciar novos containers
docker-compose up -d 2>&1 | tail -5

# Aguardar inicialização
sleep 5
"
Write-Host "✅ Docker reiniciado" -ForegroundColor Green

# ============================================
# ETAPA 6: Validar Health Checks
# ============================================
Write-Host "`n[6/6] Validando saúde da aplicação..." -ForegroundColor Green

$HEALTH_CHECKS = @(
    @{ Name = "Backend"; Port = 3000; Path = "/" },
    @{ Name = "PostgreSQL"; Port = 5432; Path = "" },
    @{ Name = "Redis"; Port = 6379; Path = "" }
)

$FAILED = 0
foreach ($check in $HEALTH_CHECKS) {
    Write-Host "  → Verificando $($check.Name) na porta $($check.Port)..." -ForegroundColor Cyan
    
    $RESULT = ssh -i $SSH_KEY "$VPS_USER@$VPS_HOST" "
    if [ '$($check.Port)' = '5432' ]; then
      nc -zv localhost $($check.Port) 2>&1 | grep -q 'succeeded' && echo 'OK' || echo 'FAIL'
    elif [ '$($check.Port)' = '6379' ]; then
      redis-cli -p $($check.Port) ping 2>&1 | grep -q 'PONG' && echo 'OK' || echo 'FAIL'
    else
      curl -s http://localhost:$($check.Port)$($check.Path) > /dev/null && echo 'OK' || echo 'FAIL'
    fi
    " 2>&1 | tail -1
    
    if ($RESULT -match 'OK') {
        Write-Host "    ✅ $($check.Name) respondendo" -ForegroundColor Green
    } else {
        Write-Host "    ❌ $($check.Name) não respondendo" -ForegroundColor Red
        $FAILED++
    }
}

Write-Host ""
Write-Host "====== DEPLOY CONCLUÍDO =======" -ForegroundColor Cyan

if ($FAILED -eq 0) {
    Write-Host "✅ SUCESSO! Aplicação rodando normalmente" -ForegroundColor Green
    Write-Host "Backend: http://$VPS_HOST:3000" -ForegroundColor Yellow
    Write-Host "Backup: $APP_PATH/backups/backend_$BACKUP_TIME.tar.gz" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  $FAILED serviço(s) com problema. Verifique logs:" -ForegroundColor Yellow
    Write-Host "ssh -i $SSH_KEY $VPS_USER@$VPS_HOST" -ForegroundColor Cyan
    Write-Host "docker-compose logs -f" -ForegroundColor Cyan
}
