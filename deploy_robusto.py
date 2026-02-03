#!/usr/bin/env python3
"""
Script robusto para deploy na VPS
Mais tolerante a timeouts e demoras
"""

import paramiko
import time
import sys

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

HOST = '46.202.147.151'
USER = 'root'
PASSWORD = '2705#Data2705'

def cmd(comando, timeout=30, espera_antes=0, espera_depois=2):
    """Executa comando com mais robustez"""
    if espera_antes > 0:
        print(f"  Aguardando {espera_antes}s antes de executar...")
        time.sleep(espera_antes)
    
    print(f"$ {comando}")
    
    try:
        stdin, stdout, stderr = ssh.exec_command(comando, timeout=timeout)
        
        # Lê output
        out = stdout.read().decode()
        err = stderr.read().decode()
        
        if out:
            print(out[:500])  # Printa apenas primeiros 500 chars
        if err:
            print(f"STDERR: {err[:300]}")
        
        time.sleep(espera_depois)
        return out, err
    except Exception as e:
        print(f"❌ Erro: {e}")
        return "", str(e)

print("=" * 70)
print("DEPLOY ROBUSTO - VPS 46.202.147.151")
print("=" * 70)

# Conectar
print("\n[CONECTANDO]")
try:
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15)
    print("✓ Conectado!")
except Exception as e:
    print(f"❌ Falha na conexão: {e}")
    sys.exit(1)

# Docker compose content
compose = """version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: botia-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: botia_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: botia-redis
    ports:
      - "6379:6379"
    restart: unless-stopped
    volumes:
      - redis_data:/data

  backend:
    image: node:22-alpine
    container_name: botia-backend
    working_dir: /app
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/botia_db
      REDIS_URL: redis://redis:6379
    volumes:
      - .:/app
    command: sh -c "npm ci --omit=dev && node apps/backend/dist/main"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
"""

print("\n[1] Parando containers antigos (espera até 20s)...")
cmd("cd /var/www/botia && docker-compose down 2>&1 || true", timeout=20, espera_depois=3)

print("\n[2] Removendo containers órfãos...")
cmd("docker rm -f botia-backend botia-postgres botia-redis 2>&1 || true", timeout=15, espera_depois=2)

print("\n[3] Criando docker-compose.yml...")
# Usa heredoc para criar arquivo
heredoc_cmd = f"""cd /var/www/botia && cat > docker-compose.yml << 'EOFCOMPOSE'
{compose}
EOFCOMPOSE"""

cmd(heredoc_cmd, timeout=10, espera_depois=2)

print("\n[4] Iniciando containers (pode levar 20-30s)...")
cmd("cd /var/www/botia && docker-compose up -d 2>&1", timeout=45, espera_depois=5)

print("\n[5] Status dos containers...")
cmd("cd /var/www/botia && docker-compose ps -a", timeout=10, espera_depois=2)

print("\n[6] Aguardando inicialização completa (20s)...")
time.sleep(20)

print("\n[7] Logs do backend...")
cmd("docker logs botia-backend 2>&1 | tail -40", timeout=10, espera_depois=1)

print("\n[8] Testando porta 3000...")
cmd("netstat -tlnp 2>/dev/null | grep 3000 || ss -tlnp 2>/dev/null | grep 3000", timeout=10)

print("\n[9] Curl para health...")
cmd("curl -s http://localhost:3000/health || echo 'Ainda não respondendo'", timeout=10)

print("\n" + "=" * 70)
print("✅ DEPLOY COMPLETADO")
print("=" * 70)
print("\nPróximas ações:")
print("1. Verifique: docker logs botia-backend")
print("2. Teste: curl http://localhost:3000/health")
print("3. Browser: https://apipgsoft.shop/")

ssh.close()
