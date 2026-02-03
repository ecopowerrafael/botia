# COMANDOS DEPLOY - PRONTOS PARA EXECUTAR

# ============================================
# 1. TESTE CONEXÃO SSH
# ============================================
ssh root@46.202.147.151 "echo 'SSH OK' && date"


# ============================================
# 2. PREPARAR DIRETÓRIOS
# ============================================
ssh root@46.202.147.151 "
mkdir -p /app/apps/backend/dist
mkdir -p /app/prisma
mkdir -p /app/infra
ls -la /app/
"


# ============================================
# 3. COPIAR ARQUIVOS COMPILADOS
# ============================================
scp -r "apps/backend/dist" root@46.202.147.151:/app/apps/backend/
scp "apps/backend/package.json" root@46.202.147.151:/app/apps/backend/
scp "apps/backend/package-lock.json" root@46.202.147.151:/app/apps/backend/
scp "prisma/schema.prisma" root@46.202.147.151:/app/prisma/
scp "infra/docker-compose.yml" root@46.202.147.151:/app/infra/


# ============================================
# 4. INSTALAR DEPENDÊNCIAS
# ============================================
ssh root@46.202.147.151 "
cd /app/apps/backend
npm ci --omit=dev
npx prisma generate
echo 'Dependências instaladas'
"


# ============================================
# 5. VERIFICAR STATUS
# ============================================
ssh root@46.202.147.151 "
cd /app/apps/backend
echo '=== Estrutura ==='
ls -la
echo '=== Node ==='
node --version
npm --version
echo '=== Prisma ==='
npx prisma --version
"


# ============================================
# 6. INICIAR APLICAÇÃO (TESTE)
# ============================================
ssh root@46.202.147.151 "
cd /app/apps/backend
npm run start:prod
"
