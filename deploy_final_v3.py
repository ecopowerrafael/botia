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

print("🚀 DEPLOY com npm install NO BACKEND específicamente")
print("="*60)

print("\n1️⃣  Limpando...")
run('docker rm -f botia-backend')

print("\n2️⃣  Deploy com install em backend...")
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
    cd /app && npm install && \\
    cd /app/apps/backend && npm install && \\
    npx prisma generate --schema=/app/prisma/schema.prisma && \\
    node dist/main.js
  "
'''

out = run(cmd, 3)
print(f"Container: {out.strip()[:12]}")

print("\n3️⃣  Aguardando (120s)...")
for i in range(12):
    print(f"  [{(i+1)*10}s]", end="\r")
    time.sleep(10)
print()

print("\n4️⃣  Logs:")
out = run('docker logs botia-backend 2>&1', 2)
logs = out[-2000:] if len(out) > 2000 else out
print(logs)

print("\n5️⃣  Status:")
out = run('docker ps -a | grep botia-backend', 2)
status_line = out.split('\n')[0] if out else ""
print(status_line[:120])

if 'Up' in status_line:
    print("\n✅✅✅ SUCESSO!")
    print("\nBackend está pronto!")
    print("Teste: https://apipgsoft.shop/api/health")

ssh.close()
