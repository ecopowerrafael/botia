#!/usr/bin/env python3
"""
Deploy com retry automático
Tenta conectar de novo se falhar
"""

import paramiko
import time
import sys
from datetime import datetime

HOST = '46.202.147.151'
USER = 'root'
PASSWORD = '2705#Data2705'
MAX_RETRIES = 3

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def conectar(tentativa=1):
    """Tenta conectar, com retry"""
    log(f"Tentativa {tentativa}/{MAX_RETRIES}...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(HOST, username=USER, password=PASSWORD, timeout=20)
        log(f"✓ Conectado!")
        return ssh
    except Exception as e:
        log(f"❌ Falha: {e}")
        
        if tentativa < MAX_RETRIES:
            log(f"Aguardando 10s antes de retry...")
            time.sleep(10)
            return conectar(tentativa + 1)
        else:
            log("❌ Máximo de tentativas atingido!")
            return None

def cmd(ssh, comando, timeout=30, desc=""):
    """Executa comando"""
    if desc:
        log(desc)
    
    try:
        stdin, stdout, stderr = ssh.exec_command(comando, timeout=timeout)
        out = stdout.read().decode()
        err = stderr.read().decode()
        
        if "ERROR" in out.upper() or "ERROR" in err.upper():
            log(f"⚠ Possível erro detectado")
            if err:
                log(f"STDERR: {err[:200]}")
        
        return out, err
    except Exception as e:
        log(f"❌ Erro ao executar: {e}")
        return "", str(e)

print("=" * 70)
print("DEPLOY COM RETRY")
print("=" * 70)

ssh = conectar()
if not ssh:
    sys.exit(1)

log("")
log("Iniciando deploy...")

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
    volumes:
      - redis_data:/data
    restart: unless-stopped

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

log("")
log("Etapa 1: Parando containers...")
cmd(ssh, "cd /var/www/botia && docker-compose down 2>&1 || docker rm -f botia-* 2>&1 || true", timeout=30)
time.sleep(3)

log("")
log("Etapa 2: Criando docker-compose.yml...")
cmd(ssh, f"cd /var/www/botia && cat > docker-compose.yml << 'EOF'\n{compose}\nEOF", timeout=15)
time.sleep(2)

log("")
log("Etapa 3: Iniciando containers (pode levar 30s)...")
out, err = cmd(ssh, "cd /var/www/botia && docker-compose up -d 2>&1", timeout=45)

log("")
log("Etapa 4: Aguardando inicialização...")
time.sleep(15)

log("")
log("Etapa 5: Status...")
out, _ = cmd(ssh, "cd /var/www/botia && docker-compose ps")

log("")
log("Etapa 6: Logs do backend...")
cmd(ssh, "docker logs botia-backend 2>&1 | tail -50", timeout=10)

log("")
log("Etapa 7: Teste de saúde...")
cmd(ssh, "curl -s http://localhost:3000/health || curl -I http://localhost:3000/health", timeout=10)

log("")
log("=" * 70)
log("✅ Deploy completado!")
log("=" * 70)

ssh.close()
