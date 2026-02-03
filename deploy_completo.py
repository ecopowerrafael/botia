#!/usr/bin/env python3
import paramiko
import time

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=30)

def run(cmd, wait=2):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    time.sleep(wait)
    out = stdout.read().decode()
    return out

print("🔧 Deploy FINAL do backend...")

print("\n1️⃣  Removendo container...")
run('docker rm -f botia-backend')

print("\n2️⃣  Deploy completo...")
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
    cd /app && npm ci --omit=dev && \\
    npx prisma generate --schema=/app/prisma/schema.prisma && \\
    cd /app/apps/backend && npm ci --omit=dev && \\
    node dist/main.js
  "
'''

out = run(cmd, 3)
print(f"✅ Container criado: {out.strip()[:12]}")

print("\n3️⃣  Aguardando (60s)...")
for i in range(6):
    print(f"  {i*10}s")
    time.sleep(10)

print("\n4️⃣  Logs:")
out = run('docker logs botia-backend 2>&1', 2)
last_lines = out[-2000:] if len(out) > 2000 else out
print(last_lines)

print("\n5️⃣  Status:")
out = run('docker ps -a | grep botia-backend', 2)
print(out)

if 'Up' in out:
    print("\n✅✅✅ BACKEND ESTÁ RODANDO!")
elif 'Exited' in out:
    print("\n❌ Container saiu")

ssh.close()
