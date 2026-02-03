#!/usr/bin/env python3
import paramiko
import sys

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=20)

print("✅ Conectado a VPS")
print("\n📂 Verificando dist na VPS...")

stdin, stdout, stderr = ssh.exec_command('find /var/www/botia/apps/backend/dist -name "prisma.service.js" -exec wc -l {} \\;')
result = stdout.read().decode().strip()
print(f"prisma.service.js:\n{result}")

stdin, stdout, stderr = ssh.exec_command('ls -la /var/www/botia/apps/backend/dist | head -15')
print("\nPrimeiros arquivos da dist:")
print(stdout.read().decode())

ssh.close()
