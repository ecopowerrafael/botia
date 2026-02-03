#!/usr/bin/env python3
"""
Restart backend sem migration
"""

import paramiko
import time

HOST = '46.202.147.151'
USER = 'root'
PASSWORD = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=20)

def cmd(c, desc="", wait=2):
    if desc:
        print(f"\n{desc}")
    print(f"$ {c}")
    stdin, stdout, stderr = ssh.exec_command(c, timeout=45)
    out = stdout.read().decode()
    if out.strip():
        for line in out.split('\n')[:15]:
            if line.strip():
                print(f"  {line}")
    time.sleep(wait)
    return out

print("=" * 70)
print("RESTART BACKEND - SEM MIGRATION")
print("=" * 70)

cmd("docker rm -f botia-backend", "1. Removendo backend antigo")

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
  sh -c "npm ci --omit=dev && node apps/backend/dist/main" """, "2. Iniciando backend com npm ci", wait=30)

cmd("docker ps -a | grep botia-backend", "3. Status")

cmd("sleep 5 && docker logs botia-backend 2>&1 | tail -60", "4. Logs do backend")

cmd("curl -s http://localhost:3000/health && echo OK || echo 'Nao respondeu'", "5. Teste health")

print("\n" + "=" * 70)
print("✅ DONE!")
print("=" * 70)

ssh.close()
