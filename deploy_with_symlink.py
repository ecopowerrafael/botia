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
    stdin, stdout, stderr = ssh.exec_command(cmd)
    time.sleep(2)
    out = stdout.read().decode()
    return out

print("🔧 Preparando estrutura de volumes...")

print("\n1️⃣  Criando symlink de .prisma...")
run('''
cd /var/www/botia/apps/backend/node_modules && \\
rm -rf .prisma && \\
ln -s /var/www/botia/node_modules/.prisma .prisma && \\
ls -la | grep prisma
''')

print("\n2️⃣  Removendo container antigo...")
run('docker rm -f botia-backend')

time.sleep(2)

print("\n3️⃣  Deploying com volumes corretos...")
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
  sh -c "cd /app/apps/backend && node dist/main.js"
'''

out = run(cmd)
print(f"Container: {out.strip()[:12]}")

time.sleep(15)

print("\n4️⃣  Logs:")
out = run('docker logs botia-backend 2>&1')
print(out[-1000:] if len(out) > 1000 else out)

print("\n5️⃣  Status:")
out = run('docker ps | grep botia-backend || echo "Container not running"')
print(out)

if 'Listening' in out or '[Nest]' in out:
    print("\n✅✅✅ SUCESSO!")

ssh.close()
