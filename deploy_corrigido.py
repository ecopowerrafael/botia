#!/usr/bin/env python3
"""
Deploy FINAL com código corrigido
"""

import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('46.202.147.151', username='root', password='2705#Data2705', timeout=20)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)
    return stdout.read().decode()

print("DEPLOY COM CÓDIGO CORRIGIDO")

# 1. Remove backend
run("docker rm -f botia-backend")
time.sleep(2)

# 2. Backend com código novo
result = run("""docker run -d --name botia-backend -p 3000:3000 -e NODE_ENV=production -e DATABASE_URL="postgresql://postgres:postgres@botia-postgres:5432/botia_db" -e REDIS_URL="redis://botia-redis:6379" -w /app -v /var/www/botia:/app --link botia-postgres:botia-postgres --link botia-redis:botia-redis node:22-alpine sh -c "npm install && npx prisma generate && node apps/backend/dist/main" """)

print(f"Backend ID: {result.strip()}")

time.sleep(40)

# 3. Status
status = run("docker ps -a | grep botia-backend")
print("\nStatus:")
print(status)

# 4. Logs
logs = run("docker logs botia-backend 2>&1 | tail -150")
print("\nLogs:")
print(logs)

# 5. Health
health = run("curl -s http://localhost:3000/health 2>&1")
print("\nHealth:")
print(health)

ssh.close()

if "listening" in logs.lower() or "OK" in health or "{" in health:
    print("\n🎉 🎉 🎉 SUCESSO TOTAL! 🎉 🎉 🎉")
else:
    print("\n⚠ Verificar logs acima")
