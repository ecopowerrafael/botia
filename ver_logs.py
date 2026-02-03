#!/usr/bin/env python3
"""
Ver logs do backend para entender o erro
"""

import paramiko

HOST = '46.202.147.151'
USER = 'root'
PASSWORD = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=20)

def cmd(c):
    stdin, stdout, stderr = ssh.exec_command(c, timeout=15)
    return stdout.read().decode()

print("DIAGNOSTICO - BACKEND LOGS")
print("=" * 70)

print("\n[1] Logs completos do backend:")
print(cmd("docker logs botia-backend 2>&1"))

print("\n[2] Status do postgres:")
print(cmd("docker logs botia-postgres 2>&1 | tail -20"))

print("\n[3] Verificar se postgres está respondendo:")
print(cmd("docker exec botia-postgres psql -U postgres -d botia_db -c 'SELECT 1;' 2>&1"))

print("\n[4] Verificar se redis está respondendo:")
print(cmd("docker exec botia-redis redis-cli ping 2>&1"))

print("\n[5] Conteúdo do .env:")
print(cmd("cat /var/www/botia/.env"))

print("\n[6] Conteúdo do schema.prisma:")
print(cmd("cat /var/www/botia/prisma/schema.prisma | head -20"))

ssh.close()
