#!/usr/bin/env python3
"""
Sync CORRETO + Deploy backend
"""
import paramiko
import os
import time
import sys

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

def upload_file(sftp, local_file, remote_file):
    """Upload single file"""
    try:
        sftp.put(local_file, remote_file)
        return True
    except:
        return False

print("="*60)
print("FASE 1: Upload do arquivo prisma.service.js CORRIGIDO")
print("="*60)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print(f"\n🔌 Conectando {host}...")
ssh.connect(host, username=user, password=password, timeout=30)

sftp = ssh.open_sftp()

local_file = r'C:\bot ia\apps\backend\dist\shared\prisma.service.js'
remote_file = '/var/www/botia/apps/backend/dist/shared/prisma.service.js'

print(f"\n⬆️  Enviando {local_file}")
print(f"    para {remote_file}")

if upload_file(sftp, local_file, remote_file):
    print("✅ Upload completo!")
else:
    print("❌ Falha no upload!")
    sys.exit(1)

# Verificar
print("\n🔍 Verificando conteúdo no servidor...")
stdin, stdout, stderr = ssh.exec_command('grep "datasources" ' + remote_file)
if stdout.read().decode().strip():
    print("✅ Arquivo CORRIGIDO na VPS!")
else:
    print("❌ Arquivo ainda antigo!")
    sys.exit(1)

sftp.close()

print("\n" + "="*60)
print("FASE 2: Redeploy backend")
print("="*60)

# Remove old container
print("\n🗑️  Removendo container antigo...")
stdin, stdout, stderr = ssh.exec_command('docker rm -f botia-backend 2>&1')
time.sleep(2)

# Deploy new container
print("\n🚀 Iniciando novo container...")
deploy_cmd = '''
docker run -d \
  --name botia-backend \
  --network botia-network \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://postgres:postgres2024@botia-postgres:5432/botia_db" \
  -e REDIS_URL="redis://botia-redis:6379" \
  -e JWT_SECRET="jwt-secret-key-2024" \
  -e API_PORT=3000 \
  -v /var/www/botia:/app \
  node:22-alpine \
  sh -c "cd /app/apps/backend && node dist/main.js"
'''

stdin, stdout, stderr = ssh.exec_command(deploy_cmd)
container_id = stdout.read().decode().strip()
if container_id:
    print(f"✅ Container criado: {container_id[:12]}...")
else:
    print(f"⚠️  {stderr.read().decode()[:200]}")

time.sleep(5)

# Check status
print("\n📋 Status:")
stdin, stdout, stderr = ssh.exec_command('docker ps -a | grep botia-backend')
print(stdout.read().decode())

# Logs
print("\n📜 Logs (últimas 50 linhas):")
stdin, stdout, stderr = ssh.exec_command('docker logs botia-backend 2>&1 | tail -50')
logs = stdout.read().decode()
print(logs)

# Verificar se tem erro
if 'PrismaClientInitializationError' in logs:
    print("\n❌ AINDA TEM ERRO DE PRISMA!")
    print("Iniciando investigação...")
elif 'Listening on port' in logs or 'listening' in logs.lower():
    print("\n✅✅✅ BACKEND ESTÁ RODANDO!")
else:
    print("\n⏳ Aguardando inicialização completa...")

print("\n" + "="*60)
print("Deploy concluído!")
print("="*60)

ssh.close()
