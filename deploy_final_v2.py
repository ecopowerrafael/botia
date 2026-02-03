#!/usr/bin/env python3
import paramiko
import time

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=30)

def run(cmd, wait=3):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    time.sleep(wait)
    out = stdout.read().decode()
    return out

print("🚀 DEPLOY FINAL - Versão Simplificada")
print("="*60)

print("\n1️⃣  Verificando/limpando...")
run('docker rm -f botia-backend')

print("\n2️⃣  Deploy com npm install (sem --omit=dev)...")
cmd = '''docker run -d \\
  --name botia-backend \\
  --network botia-network \\
  --link botia-postgres:botia-postgres \\
  --link botia-redis:botia-redis \\
  -p 3000:3000 \\
  -e NODE_ENV=production \\
  -e DATABASE_URL="postgresql://postgres:postgres2024@botia-postgres:5432/botia_db" \\
  -e REDIS_URL="redis://botia-redis:6379" \\
  -e JWT_SECRET="jwt-secret-key-2024" \\
  -v /var/www/botia:/app \\
  node:22-alpine \\
  sh -c "
    set -e
    echo '📦 npm install na raiz...' && \\
    cd /app && npm install && \\
    echo '🔧 Gerando Prisma...' && \\
    npx prisma generate --schema=/app/prisma/schema.prisma && \\
    echo '🚀 Iniciando backend...' && \\
    cd /app/apps/backend && \\
    node dist/main.js
  "
'''

out = run(cmd, 3)
container = out.strip()[:12]
print(f"Container: {container}")

print("\n3️⃣  Aguardando inicialização (90s)...")
for i in range(9):
    print(f"  [{(i+1)*10}s]")
    time.sleep(10)

print("\n4️⃣  Status e Logs:")
out = run('docker ps -a | grep botia-backend', 2)
print("Status:", out.split('\n')[0][:100] if out else "N/A")

out = run('docker logs botia-backend 2>&1', 2)
logs = out[-2500:] if len(out) > 2500 else out
print("\nÚltimos logs:")
print(logs)

print("\n" + "="*60)
if 'listening' in logs.lower() or '[nest]' in logs.lower() or 'started successfully' in logs.lower():
    print("✅✅✅ BACKEND RODANDO COM SUCESSO!")
elif 'cannot find module' in logs.lower():
    print("❌ Faltam módulos")
else:
    print("⏳ Verificando...")

ssh.close()
