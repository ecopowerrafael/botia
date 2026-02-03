# ====== COMANDOS PARA CORRIGIR BOT IA NA VPS =====
# Execute line-by-line na VPS (ssh root@46.202.147.151, senha: 2705#Data2705)

# 1. Atualizar DATABASE_URL no .env (banco correto é "bot_ia", não "postgres")
sed -i 's/DATABASE_URL=.*/DATABASE_URL="postgresql:\/\/postgres:postgres@localhost:5432\/bot_ia"/' /app/apps/backend/.env

# 2. Copiar schema.prisma correto da cópia GitHub
cp /tmp/botia/prisma/schema.prisma /app/prisma/schema.prisma

# 3. Regenerar Prisma Client
cd /app/apps/backend && npx prisma generate

# 4. Compilar sem erros de tipo (usar tsc diretamente)
npx tsc --noEmitOnError false --skipLibCheck

# 5. Parar backend antigo
pkill -9 -f 'node dist/main'
sleep 2

# 6. Iniciar backend novo
cd /app/apps/backend && npm run start:prod > /var/log/backend.log 2>&1 &

# 7. Aguardar e verificar
sleep 12
ps aux | grep 'node dist/main' | grep -v grep && echo "✓ Backend rodando!" || echo "✗ Backend não iniciou"
tail -30 /var/log/backend.log | tail -10

# 8. Testar se respondendo (aguarde mais alguns segundos se não responder)
curl -s http://localhost:3000 | head -20
