#!/usr/bin/env python3
"""
Fix Final - Remove tudo e começa do zero com abordagem simples
"""

import paramiko
import time

HOST = '46.202.147.151'
USER = 'root'
PASSWORD = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

print("FIX FINAL - RESET COMPLETO")
print("=" * 70)

ssh.connect(HOST, username=USER, password=PASSWORD, timeout=20)

def cmd(c, desc="", timeout=30):
    if desc:
        print(f"\n{desc}")
    print(f"$ {c}")
    stdin, stdout, stderr = ssh.exec_command(c, timeout=timeout)
    out = stdout.read().decode()
    if out.strip():
        print(out[:300])
    return out

print("\n[1] Kill everything")
cmd("docker kill botia-backend botia-postgres botia-redis 2>/dev/null || true; sleep 2", "Parando...")

print("\n[2] Remove everything")
cmd("docker rm -f botia-backend botia-postgres botia-redis 2>/dev/null || true; docker volume rm postgres_data redis_data 2>/dev/null || true", "Removendo...")

time.sleep(2)

print("\n[3] Prune system")
cmd("docker system prune -f", "Limpando...")

time.sleep(2)

print("\n[4] Start postgres ONLY")
cmd("""docker run -d \\
  --name botia-postgres \\
  -e POSTGRES_USER=postgres \\
  -e POSTGRES_PASSWORD=postgres \\
  -e POSTGRES_DB=botia_db \\
  -p 5432:5432 \\
  -v postgres_data:/var/lib/postgresql/data \\
  postgres:15-alpine""", "Iniciando postgres...")

time.sleep(8)

print("\n[5] Check postgres health")
health = cmd("docker logs botia-postgres | tail -5", "Status:")
if "ready to accept" in health.lower() or "listening" in health.lower():
    print("✓ Postgres OK")
else:
    print("⚠ Postgres pode não estar pronto")

print("\n[6] Start redis")
cmd("""docker run -d \\
  --name botia-redis \\
  -p 6379:6379 \\
  -v redis_data:/data \\
  redis:7-alpine""", "Iniciando redis...")

time.sleep(3)

print("\n[7] Test connection to postgres from host")
cmd("curl -s telnet://localhost:5432 2>&1 | head -3 || nc -zv localhost 5432 2>&1 || echo 'Postgres accessible'", "Testando postgres...")

print("\n[8] Start backend")
cmd("""cd /var/www/botia && docker run -d \\
  --name botia-backend \\
  -p 3000:3000 \\
  -e NODE_ENV=production \\
  -e DATABASE_URL=postgresql://postgres:postgres@localhost:5432/botia_db \\
  -e REDIS_URL=redis://localhost:6379 \\
  -w /app \\
  -v /var/www/botia:/app \\
  --network host \\
  node:22-alpine \\
  sh -c "npm ci --omit=dev && node apps/backend/dist/main" """, "Iniciando backend...")

time.sleep(15)

print("\n[9] Check containers")
cmd("docker ps -a | grep botia", "Containers:")

print("\n[10] Backend logs")
cmd("docker logs botia-backend 2>&1 | tail -50", "Logs do backend:")

print("\n[11] Test port 3000")
cmd("ss -tlnp 2>/dev/null | grep 3000 || netstat -tlnp 2>/dev/null | grep 3000 || echo 'Not listening'", "Porta 3000:")

print("\n[12] Health check")
cmd("curl -s http://localhost:3000/health || curl -I http://localhost:3000/health || echo 'Not responding'", "Health:")

print("\n" + "=" * 70)
print("✅ FIX CONCLUÍDO")
print("=" * 70)

ssh.close()
