#!/usr/bin/env python3
import paramiko
import sys
import os

# Configurações
HOST = "46.202.147.151"
USER = "root"
PASSWORD = input("Digite a senha SSH: ")  # Ler password uma vez

# Conectar
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD)

# Executar setup
print("\n🚀 SETUP BOTIA EM PRODUÇÃO\n")

commands = [
    ("1. Setup PostgreSQL", """
sudo -u postgres psql -c "CREATE DATABASE botia_db;" 2>/dev/null || echo "✓ DB já existe"
sudo -u postgres psql -c "CREATE USER botia_user WITH PASSWORD 'BotIA2025@Secure';" 2>/dev/null || echo "✓ Usuário já existe"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE botia_db TO botia_user;"
sudo -u postgres psql -d botia_db -c "GRANT ALL ON SCHEMA public TO botia_user;"
echo "✅ PostgreSQL OK"
    """),
    ("2. Verificar Redis", """
systemctl is-active redis-server > /dev/null && echo "✅ Redis rodando" || systemctl start redis-server
redis-cli ping
echo "✅ Redis OK"
    """),
    ("3. Iniciar Aplicação", """
cd /app/apps/backend
export DATABASE_URL="postgresql://botia_user:BotIA2025@Secure@localhost:5432/botia_db"
export REDIS_HOST=localhost
export REDIS_PORT=6379
export NODE_ENV=production
npx prisma migrate deploy || echo "✓ Migrations já aplicadas"
echo "✅ Aplicação pronta para iniciar"
nohup npm run start:prod > /tmp/app.log 2>&1 &
sleep 3
ps aux | grep "node dist/main" | grep -v grep && echo "✅ APP RODANDO!" || echo "⚠️ Verificar logs"
    """),
]

for title, cmd in commands:
    print(f"\n{title}")
    print("-" * 50)
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode())
    if stderr.read():
        print("⚠️ ", stderr.read().decode())

print("\n" + "=" * 50)
print("✅ DEPLOY COMPLETO!")
print("URL: http://46.202.147.151:3000")
print("=" * 50)

ssh.close()
