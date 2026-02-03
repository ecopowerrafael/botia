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

print("🔧 Preparando estrutura para backend...")

print("\n1️⃣  Removendo container...")
run('docker rm -f botia-backend')

print("\n2️⃣  Deploy (npm ci, prisma gen com schema path)...")
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
    cd /app && \\
    npm ci --omit=dev && \\
    npx prisma generate --schema=/app/prisma/schema.prisma && \\
    cd /app/apps/backend && \\
    node dist/main.js
  "
'''

out = run(cmd, 3)
print(f"Container: {out.strip()[:12]}")

print("\n3️⃣  Aguardando inicialização (40s)...")
time.sleep(40)

print("\n4️⃣  Logs:")
out = run('docker logs botia-backend 2>&1', 2)
print(out[-1500:] if len(out) > 1500 else out)

print("\n5️⃣  Status:")
out = run('docker ps | grep botia-backend', 2)

if out and 'Up' in out:
    print("✅ Container está rodando!")
elif out and 'Exited' in out:
    print("❌ Container saiu")
else:
    print("Container not found")

ssh.close()
