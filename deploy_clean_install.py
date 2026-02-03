#!/usr/bin/env python3
import paramiko
import time

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=30)

def run(cmd, wait=5):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    time.sleep(wait)
    out = stdout.read().decode()
    return out

print("🔧 Removendo node_modules antigos e reinstalando...")

print("\n1️⃣  Removendo container...")
run('docker rm -f botia-backend')

print("\n2️⃣  Removendo node_modules VPS...")
run('rm -rf /var/www/botia/node_modules /var/www/botia/apps/backend/node_modules')

print("\n3️⃣  Deploy com npm ci (clean install)...")
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
    cd /app && npm ci && \\
    cd /app/apps/backend && npm ci && \\
    npx prisma generate --schema=/app/prisma/schema.prisma && \\
    node dist/main.js
  "
'''

out = run(cmd, 3)
print(f"Container: {out.strip()[:12]}")

print("\n4️⃣  Aguardando instalação (150s)...")
for i in range(15):
    print(f"  [{(i+1)*10}s]", end="\r")
    time.sleep(10)
print()

print("\n5️⃣  Logs:")
out = run('docker logs botia-backend 2>&1', 2)
logs = out[-2500:] if len(out) > 2500 else out
print(logs)

print("\n6️⃣  Status:")
out = run('docker ps -a | grep botia-backend', 2)
print(out.split('\n')[0][:120] if out else "N/A")

if 'Up' in out:
    print("\n✅✅✅ BACKEND RODANDO!")

ssh.close()
