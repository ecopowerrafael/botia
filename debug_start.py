#!/usr/bin/env python3
import paramiko
import time

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=30)

print("🔍 Investigando por que container não inicia...")

# Remover container
print("\n1️⃣  Removendo container...")
stdin, stdout, stderr = ssh.exec_command('docker rm -f botia-backend')
stdout.read()
time.sleep(2)

# Tentar iniciar sem -d para ver erro direto
print("\n2️⃣  Iniciando container em foreground (30s)...")
print("-" * 60)

cmd = '''timeout 30 docker run \\
  --name botia-backend \\
  --network botia-network \\
  -p 3000:3000 \\
  -e NODE_ENV=production \\
  -e DATABASE_URL="postgresql://postgres:postgres2024@botia-postgres:5432/botia_db" \\
  -e REDIS_URL="redis://botia-redis:6379" \\
  -v /var/www/botia/apps/backend/dist:/app/dist \\
  -v /var/www/botia/apps/backend/node_modules:/app/node_modules \\
  node:22-alpine \\
  node /app/dist/main.js 2>&1
'''

stdin, stdout, stderr = ssh.exec_command(cmd)
time.sleep(35)

output = stdout.read().decode()
error = stderr.read().decode()

print("OUTPUT:")
print(output[-2000:] if len(output) > 2000 else output)

if error:
    print("\nERROR:")
    print(error[-1000:] if len(error) > 1000 else error)

ssh.close()
