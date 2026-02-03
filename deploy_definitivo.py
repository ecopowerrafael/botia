#!/usr/bin/env python3
"""
Deploy DEFINITIVO - Sem complicações
"""

import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('46.202.147.151', username='root', password='2705#Data2705', timeout=20)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)
    return stdout.read().decode()

print("DEPLOY FINAL")

# 1. Kill tudo
run("docker rm -f botia-backend botia-postgres botia-redis 2>/dev/null || true")
time.sleep(3)

# 2. Postgres
run("docker run -d --name botia-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=botia_db -p 5432:5432 -v postgres_data:/var/lib/postgresql/data postgres:15-alpine")
time.sleep(8)

# 3. Redis
run("docker run -d --name botia-redis -p 6379:6379 -v redis_data:/data redis:7-alpine")
time.sleep(3)

# 4. Backend - SEM OMIT-DEV, COM PRISMA GENERATE
run("""docker run -d --name botia-backend -p 3000:3000 -e NODE_ENV=production -e DATABASE_URL="postgresql://postgres:postgres@botia-postgres:5432/botia_db" -e REDIS_URL="redis://botia-redis:6379" -w /app -v /var/www/botia:/app --link botia-postgres:botia-postgres --link botia-redis:botia-redis node:22-alpine sh -c "npm install && npx prisma generate && node apps/backend/dist/main" """)

time.sleep(40)

# 5. Ver status
status = run("docker ps -a | grep botia")
print("\nStatus:")
print(status)

# 6. Ver logs
logs = run("docker logs botia-backend 2>&1 | tail -100")
print("\nLogs:")
print(logs)

# 7. Teste
health = run("curl -s http://localhost:3000/health 2>&1")
print("\nHealth test:")
print(health)

ssh.close()

if "OK" in health or "{" in health or "listening" in logs.lower():
    print("\n✅ ✅ ✅ SUCESSO! ✅ ✅ ✅")
else:
    print("\n❌ Backend ainda não respondendo")
