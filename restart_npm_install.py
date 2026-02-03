#!/usr/bin/env python3
"""
Restart com npm install (não omit-dev)
"""

import paramiko
import time

HOST = '46.202.147.151'
USER = 'root'
PASSWORD = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=20)

def cmd(c, desc="", wait=1):
    if desc:
        print(f"\n{desc}")
    stdin, stdout, stderr = ssh.exec_command(c, timeout=45)
    out = stdout.read().decode()
    if out.strip():
        for line in out.split('\n')[:25]:
            if line.strip():
                print(f"  {line}")
    time.sleep(wait)
    return out

print("=" * 70)
print("RESTART COM NPM INSTALL")
print("=" * 70)

cmd("docker rm -f botia-backend", "1. Removendo backend")

time.sleep(2)

cmd("""docker run -d --name botia-backend \\
  -p 3000:3000 \\
  -e NODE_ENV=production \\
  -e DATABASE_URL="postgresql://postgres:postgres@botia-postgres:5432/botia_db" \\
  -e REDIS_URL="redis://botia-redis:6379" \\
  -w /app \\
  -v /var/www/botia:/app \\
  -v /var/www/botia/.env:/app/.env \\
  --link botia-postgres:botia-postgres \\
  --link botia-redis:botia-redis \\
  node:22-alpine \\
  sh -c "npm install && npx prisma generate && node apps/backend/dist/main" """, "2. Iniciando com npm install + prisma generate", wait=40)

cmd("docker logs botia-backend 2>&1 | tail -100", "3. Logs", wait=2)

cmd("curl -s http://localhost:3000/health && echo ' ✅ SUCESSO!' || echo ' ❌ Nao respondeu'", "4. Teste final", wait=1)

cmd("docker ps -a | grep botia", "5. Status dos containers")

print("\n" + "=" * 70)
print("PRONTO!")
print("=" * 70)

ssh.close()
