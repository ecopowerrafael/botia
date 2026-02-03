#!/bin/bash
set -e

echo "╔════════════════════════════════════════╗"
echo "║  RESET COMPLETO - VPS DO ZERO           ║"
echo "║  Backup → Limpeza → Reinstalação        ║"
echo "╚════════════════════════════════════════╝"

# 1. BACKUP DE DADOS CRÍTICOS
echo -e "\n[1/7] Fazendo backup de dados críticos..."
mkdir -p ~/backups
if [ -d ~/apps/seu-projeto/infra/.env ]; then
  cp ~/apps/seu-projeto/infra/.env ~/backups/.env.backup.$(date +%s)
  echo "✓ .env salvo"
fi

# 2. PARAR TODOS OS SERVIÇOS
echo -e "\n[2/7] Parando containers..."
if [ -d ~/apps/seu-projeto/infra ]; then
  cd ~/apps/seu-projeto/infra
  docker-compose down -v 2>/dev/null || true
  echo "✓ Containers parados e volumes removidos"
fi

# 3. LIMPAR DIRETÓRIOS
echo -e "\n[3/7] Limpando diretórios..."
rm -rf ~/apps/seu-projeto
echo "✓ Projeto removido"

# 4. CLONE FRESCO DO GITHUB
echo -e "\n[4/7] Clonando projeto do GitHub (versão atualizada)..."
cd ~
git clone https://github.com/ecopowerrafael/botia.git apps/seu-projeto
cd ~/apps/seu-projeto

# 5. INSTALAR DEPENDÊNCIAS ATUALIZADAS
echo -e "\n[5/7] Instalando dependências atualizadas..."
echo "  → Root dependencies..."
cd ~/apps/seu-projeto
npm ci --verbose

echo "  → Backend dependencies..."
cd ~/apps/seu-projeto/apps/backend
npm ci --verbose

echo "  → Prisma setup..."
cd ~/apps/seu-projeto
npx prisma generate --schema prisma/schema.prisma

echo "✓ Dependências instaladas"

# 6. BUILD DO BACKEND
echo -e "\n[6/7] Compilando backend..."
cd ~/apps/seu-projeto/apps/backend
npm run build
if [ -d dist ]; then
  echo "✓ Build sucedido"
else
  echo "✗ Build falhou!"
  exit 1
fi

# 7. PREPARAR DOCKER
echo -e "\n[7/7] Preparando Docker Compose..."
cd ~/apps/seu-projeto/infra

# Verificar se .env existe, senão criar template
if [ ! -f .env ]; then
  echo "Criando .env..."
  cat > .env << 'EOF'
NODE_ENV=production
TZ=America/Sao_Paulo

# Database
POSTGRES_DB=appdb
POSTGRES_USER=appuser
POSTGRES_PASSWORD=SenhaForte@123456
POSTGRES_PORT=5432

# Redis
REDIS_PASSWORD=OutraSenha@123456
REDIS_PORT=6379

# Ollama
OLLAMA_PORT=11434

# Backend
BACKEND_PORT=3000
LOG_LEVEL=info
JWT_SECRET=StringAleatoriaCompridaAquiComMuitosCaracteres123456789ABCDEFGH
JWT_EXPIRATION=24h

# Evolution API
EVOLUTION_API_PORT=8080
EVOLUTION_LICENSE_KEY=

# Nginx
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443

# API URLs (internal)
EVOLUTION_API_URL=http://evolution-api:8080
OLLAMA_API_URL=http://ollama:11434

# CORS
CORS_ORIGIN=https://seu-dominio.com
EOF
  echo "✓ .env criado"
else
  echo "✓ .env existente"
fi

# 8. INICIAR SERVICES
echo -e "\n[BONUS] Iniciando serviços..."
docker-compose pull
docker-compose build backend --no-cache
docker-compose up -d

echo -e "\n╔════════════════════════════════════════╗"
echo "║  ✓ RESET CONCLUÍDO COM SUCESSO!         ║"
echo "╠════════════════════════════════════════╣"
echo "║  Aguarde 30 segundos para estabilizar ║"
echo "║  depois verifique com:                 ║"
echo "║  docker-compose ps                     ║"
echo "║  docker-compose logs -f --tail=100     ║"
echo "╚════════════════════════════════════════╝"

sleep 30
echo -e "\n[STATUS] Verificando containers..."
docker-compose ps
