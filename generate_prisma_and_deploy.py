#!/usr/bin/env python3
import paramiko
import time

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=30)

def run(cmd):
    print(f"▶️  {cmd[:80]}...")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    time.sleep(2)
    out = stdout.read().decode()
    return out

print("🔧 Preparando backend para deploy...")

print("\n1️⃣  Gerando Prisma Client...")
out = run('cd /var/www/botia/apps/backend && npx prisma generate')
if 'Generated Prisma Client' in out or 'Reusing Prisma Client' in out:
    print("✅ Prisma Client gerado!")
else:
    print(f"⚠️  {out[:200]}")

print("\n2️⃣  Removendo container antigo...")
run('docker rm -f botia-backend')

print("\n3️⃣  Deploy backend...")
cmd = '''docker run -d \\
  --name botia-backend \\
  --network botia-network \\
  --link botia-postgres:botia-postgres \\
  --link botia-redis:botia-redis \\
  -p 3000:3000 \\
  -e NODE_ENV=production \\
  -e DATABASE_URL="postgresql://postgres:postgres2024@botia-postgres:5432/botia_db" \\
  -e REDIS_URL="redis://botia-redis:6379" \\
  -v /var/www/botia/apps/backend:/app/backend \\
  node:22-alpine \\
  sh -c "cd /app/backend && node dist/main.js"
'''

out = run(cmd)
print(f"Container: {out.strip()[:12]}")

time.sleep(10)

print("\n4️⃣  Status:")
out = run('docker ps | grep botia-backend')
print(out[:200] or "Container não está rodando")

print("\n5️⃣  Logs:")
out = run('docker logs botia-backend 2>&1')
print(out[-1500:] if len(out) > 1500 else out)

if 'Listening on port' in out or '[Nest]' in out:
    print("\n✅✅✅ BACKEND ESTÁ RODANDO!!!")
elif 'Cannot find module' in out:
    print("\n❌ Ainda faltam módulos")
else:
    print("\n⏳ Verificando...")

ssh.close()
