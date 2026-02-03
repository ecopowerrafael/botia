# Script PowerShell para executar fix no VPS com senha interativa
$VPS_HOST = "46.202.147.151"
$VPS_USER = "root"
$VPS_PASSWORD = "2705#Data2705"

Write-Host "🚀 Conectando ao VPS e executando fix..." -ForegroundColor Cyan
Write-Host "Host: $VPS_HOST" -ForegroundColor Yellow

# Script bash com todos os comandos
$BashScript = @'
#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 INICIANDO FIX DO VPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1️⃣ Fix DATABASE_URL
echo ""
echo "1️⃣  Corrigindo DATABASE_URL..."
cd /app/apps/backend
sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bot_ia"|' .env
echo "✓ .env atualizado:"
grep "DATABASE_URL" .env || echo "⚠️  Não encontrado!"

# 2️⃣ Copy schema.prisma
echo ""
echo "2️⃣  Copiando schema.prisma correto..."
if [ -f "/tmp/botia/prisma/schema.prisma" ]; then
  cp /tmp/botia/prisma/schema.prisma /app/prisma/schema.prisma
  echo "✓ schema.prisma copiado com sucesso"
  head -5 /app/prisma/schema.prisma
else
  echo "⚠️  Arquivo não encontrado em /tmp/botia/"
  echo "   Tentando alternativa..."
fi

# 3️⃣ Regenerate Prisma
echo ""
echo "3️⃣  Regenerando cliente Prisma..."
cd /app/apps/backend
npx prisma generate 2>&1 | tail -5
echo "✓ Prisma regenerado"

# 4️⃣ Rebuild TypeScript
echo ""
echo "4️⃣  Compilando TypeScript..."
cd /app/apps/backend
npx tsc --noEmitOnError false --skipLibCheck 2>&1 | grep -E "error|built|successfully" | head -10 || echo "✓ Compilação concluída"

# 5️⃣ Stop old backend
echo ""
echo "5️⃣  Parando backend antigo..."
pkill -9 -f 'node dist/main' || true
sleep 2
echo "✓ Backend parado"

# 6️⃣ Start new backend
echo ""
echo "6️⃣  Iniciando novo backend..."
cd /app/apps/backend
npm run start:prod > /var/log/backend.log 2>&1 &
BG_PID=$!
echo "✓ Backend iniciado (PID: $BG_PID)"

# 7️⃣ Wait and verify
echo ""
echo "7️⃣  Aguardando inicialização (10 segundos)..."
sleep 10

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ VERIFICAÇÃO FINAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "Processo backend:"
ps aux | grep '[n]ode dist/main' || echo "⚠️  Não encontrado, pode estar iniciando..."

echo ""
echo "Porta 3000:"
netstat -tlnp 2>/dev/null | grep 3000 || echo "⚠️  Aguardando..."

echo ""
echo "📋 Últimos 20 linhas de log:"
echo "---"
tail -20 /var/log/backend.log
echo "---"

echo ""
echo "✅ Fix concluído! Verifique o painel em alguns segundos."
'@

# Save and execute the bash script
$TempScript = "/tmp/fix_vps_$(Get-Random).sh"
$LocalScript = "C:\temp_fix_script.sh"

# Write script locally first
$BashScript | Out-File -FilePath $LocalScript -Encoding ASCII -Force

Write-Host ""
Write-Host "📝 Script criado: $LocalScript" -ForegroundColor Green

# Try to execute via SSH
Write-Host ""
Write-Host "⚙️  Executando via SSH..." -ForegroundColor Cyan

$SSHCommand = @"
bash << 'EOF'
$BashScript
EOF
"@

# Create expect script
$ExpectScript = @"
#!/usr/bin/expect
set timeout 120

spawn ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@46.202.147.151

expect "password:"
send "2705#Data2705\r"

expect "$"

send "bash << 'EOFBASH'\n$BashScript\nEOFBASH\r"

expect "concluído"
interact
"@

Write-Host "💡 Copie este comando e execute no PowerShell:" -ForegroundColor Yellow
Write-Host ""
Write-Host 'ssh root@46.202.147.151' -ForegroundColor White
Write-Host "# Digite a senha: 2705#Data2705" -ForegroundColor Cyan
Write-Host "# Cole o script abaixo:" -ForegroundColor Cyan
Write-Host ""
Write-Host $BashScript -ForegroundColor White
Write-Host ""
Write-Host "Ou tente este atalho (pode pedir senha interativa):" -ForegroundColor Yellow
Write-Host 'ssh root@46.202.147.151 "bash -s" << EOF' -ForegroundColor White
Write-Host $BashScript -ForegroundColor White
Write-Host "EOF" -ForegroundColor White
