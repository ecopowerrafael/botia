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
    print(f"▶️  {cmd[:100]}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    time.sleep(3)
    out = stdout.read().decode()
    err = stderr.read().decode()
    full = out + err
    print(full[-400:] if len(full) > 400 else full)
    return full

print("🔧 Gerando Prisma Client com caminho correto...")

print("\n1️⃣  Verificando arquivo schema...")
out = run('ls -la /var/www/botia/apps/backend/prisma/')

print("\n2️⃣  Usando ./node_modules/.bin/prisma...")
out = run('cd /var/www/botia/apps/backend && ./node_modules/.bin/prisma generate')

print("\n3️⃣  Verificando se foi criado...")
out = run('ls -la /var/www/botia/apps/backend/node_modules/.prisma/client/ 2>&1 | head -10')

if 'No such file' in out:
    print("\n❌ Ainda não foi criado. Tentando com npm prefix...")
    out = run('cd /var/www/botia/apps/backend && npm exec prisma generate')
    
print("\n4️⃣  Verificação final:")
out = run('test -d /var/www/botia/apps/backend/node_modules/.prisma/client && echo "✅ EXISTS" || echo "❌ NOT FOUND"')

ssh.close()
