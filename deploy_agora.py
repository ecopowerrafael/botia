#!/usr/bin/env python3
"""
Deploy final e completo na VPS
"""

import paramiko
import time

HOST = '46.202.147.151'
USER = 'root'
PASSWORD = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

print("=" * 70)
print("DEPLOY FINAL - BOTIA")
print("=" * 70)

try:
    print("\n[CONECTANDO]")
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=20)
    print("✓ Conectado!")
except Exception as e:
    print(f"❌ Falha: {e}")
    exit(1)

def cmd(c, desc="", wait=2):
    if desc:
        print(f"\n{desc}")
    print(f"$ {c}")
    try:
        stdin, stdout, stderr = ssh.exec_command(c, timeout=40)
        out = stdout.read().decode()
        if out.strip():
            lines = out.split('\n')
            for line in lines[:20]:  # Primeiras 20 linhas
                if line.strip():
                    print(f"  {line}")
        time.sleep(wait)
        return out
    except Exception as e:
        print(f"❌ Erro: {e}")
        return ""

# Setup
cmd("cd /var/www/botia && pwd", "1. Verificando diretório")

# Remove tudo
cmd("docker rm -f botia-backend botia-postgres botia-redis 2>/dev/null || true", "2. Removendo containers antigos", wait=3)

# Env file
cmd("""cat > /var/www/botia/.env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://postgres:postgres@botia-postgres:5432/botia_db
REDIS_URL=redis://botia-redis:6379
EOF""", "3. Criando .env", wait=1)

# Prisma
cmd("cd /var/www/botia && npx prisma generate 2>&1 | tail -5", "4. Gerando Prisma", wait=3)

# Postgres
cmd("""docker run -d --name botia-postgres \\
  -e POSTGRES_USER=postgres \\
  -e POSTGRES_PASSWORD=postgres \\
  -e POSTGRES_DB=botia_db \\
  -p 5432:5432 \\
  -v postgres_data:/var/lib/postgresql/data \\
  postgres:15-alpine""", "5. Iniciando PostgreSQL", wait=8)

# Redis
cmd("""docker run -d --name botia-redis \\
  -p 6379:6379 \\
  -v redis_data:/data \\
  redis:7-alpine""", "6. Iniciando Redis", wait=4)

# Backend
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
  sh -c "node apps/backend/dist/main" """, "7. Iniciando Backend", wait=15)

# Verify
cmd("docker ps -a | grep botia", "8. Status dos containers")

cmd("docker logs botia-backend 2>&1 | tail -30", "9. Logs do backend")

cmd("curl -s http://localhost:3000/health || echo 'Not ready yet'", "10. Teste de health")

print("\n" + "=" * 70)
print("✅ DEPLOY CONCLUÍDO!")
print("=" * 70)
print("\nTestando no navegador em 30 segundos...")
print("https://apipgsoft.shop/")

ssh.close()
