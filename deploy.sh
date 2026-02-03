#!/bin/bash
# Deploy Simples - Hostinger 46.202.147.151

set -e  # Sair em qualquer erro

echo "===== DEPLOY PARA HOSTINGER ====="
echo "IP: 46.202.147.151"
echo ""

# Configurações
VPS_HOST="46.202.147.151"
VPS_USER="root"
APP_PATH="/app"

# 1. Teste rápido de conexão
echo "[1/4] Testando SSH..."
if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "echo OK" > /dev/null 2>&1; then
    echo "✅ SSH OK"
else
    echo "❌ SSH falhou"
    exit 1
fi

# 2. Criar diretórios
echo "[2/4] Preparando diretórios..."
ssh $VPS_USER@$VPS_HOST "
mkdir -p $APP_PATH/apps/backend/dist
mkdir -p $APP_PATH/prisma
"
echo "✅ Diretórios criados"

# 3. Copiar arquivos compilados
echo "[3/4] Enviando código compilado..."
scp -r "apps/backend/dist/*" $VPS_USER@$VPS_HOST:$APP_PATH/apps/backend/dist/ 2>/dev/null || true
scp "apps/backend/package.json" $VPS_USER@$VPS_HOST:$APP_PATH/apps/backend/ 2>/dev/null || true
scp "prisma/schema.prisma" $VPS_USER@$VPS_HOST:$APP_PATH/prisma/ 2>/dev/null || true
echo "✅ Código enviado"

# 4. Instalar e iniciar
echo "[4/4] Instalando dependências..."
ssh $VPS_USER@$VPS_HOST "
cd $APP_PATH/apps/backend
npm ci --omit=dev --silent
echo 'Dependências instaladas'
"
echo "✅ Deploy concluído!"

echo ""
echo "===== RESUMO ====="
echo "✅ Código compilado copiado"
echo "✅ Dependências instaladas"
echo ""
echo "Próximos passos na VPS:"
echo "1. cd /app/apps/backend"
echo "2. npx prisma generate"
echo "3. npm run start:prod"
echo ""
echo "Acesso: ssh root@46.202.147.151"
