#!/usr/bin/env python3
import paramiko

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=30)

# Remover container que não rodou
print("🗑️  Removendo container que não iniciou...")
stdin, stdout, stderr = ssh.exec_command('docker rm -f botia-backend')
stdout.read()

import time
time.sleep(2)

# Deploy NOVO com docker-compose (mais seguro)
print("\n📝 Fazendo deploy com docker-compose...")

compose_cmd = '''cd /var/www/botia && cat > docker-compose-backend.yml << 'EOF'
version: '3.8'
services:
  botia-backend:
    image: node:22-alpine
    container_name: botia-backend
    working_dir: /app/apps/backend
    volumes:
      - /var/www/botia:/app
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: "postgresql://postgres:postgres2024@botia-postgres:5432/botia_db"
      REDIS_URL: "redis://botia-redis:6379"
      JWT_SECRET: "jwt-secret-key-2024"
      API_PORT: 3000
    networks:
      - botia-network
    command: node dist/main.js
    restart: unless-stopped

networks:
  botia-network:
    external: true
EOF

docker-compose -f docker-compose-backend.yml up -d
'''

stdin, stdout, stderr = ssh.exec_command(compose_cmd)
result = stdout.read().decode()
print(result)

time.sleep(5)

# Verificar
print("\n✅ Container iniciado com docker-compose")
print("\nVerificando status e logs...\n")

stdin, stdout, stderr = ssh.exec_command('docker ps | grep botia-backend')
print("Status:", stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command('docker logs botia-backend 2>&1 | tail -30')
logs = stdout.read().decode()
print("Logs:\n", logs)

ssh.close()
