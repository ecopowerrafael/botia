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
    print(f"▶️  {cmd[:80]}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    time.sleep(3)
    out = stdout.read().decode()
    err = stderr.read().decode()
    return out + err

print("🔧 Verificando dependências...")

print("\n1️⃣  Verificando @prisma/client...")
out = run('ls -la /var/www/botia/apps/backend/node_modules/@prisma/client 2>&1 | head -10')
print(out[:300])

print("\n2️⃣  Rodando npm install...")
out = run('cd /var/www/botia/apps/backend && npm install 2>&1')
print(out[-500:] if len(out) > 500 else out)

print("\n3️⃣  Gerando Prisma Client...")
out = run('cd /var/www/botia/apps/backend && npm run db:generate 2>&1 || npx prisma generate 2>&1')
print(out[-300:] if len(out) > 300 else out)

print("\n4️⃣  Verificando .prisma/client...")
out = run('ls -la /var/www/botia/apps/backend/node_modules/.prisma/client 2>&1 | head -5')
print(out)

ssh.close()
