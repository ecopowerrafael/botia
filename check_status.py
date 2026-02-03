#!/usr/bin/env python3
import paramiko
import time

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=30)

print("🔍 Checando status do upload...")

# Ver quantos arquivos já foram uploadeados
stdin, stdout, stderr = ssh.exec_command('find /var/www/botia/apps/backend/dist -type f | wc -l')
count = int(stdout.read().decode().strip())
print(f"📁 Arquivos já na VPS: {count}")

# Verificar tamanho da pasta
stdin, stdout, stderr = ssh.exec_command('du -sh /var/www/botia/apps/backend/dist')
size = stdout.read().decode().strip()
print(f"📊 Tamanho já enviado: {size}")

# Procurar pelo arquivo crítico
stdin, stdout, stderr = ssh.exec_command('test -f /var/www/botia/apps/backend/dist/shared/prisma.service.js && echo "✅ PRISMA OK" || echo "⏳ Ainda não chegou"')
print(stdout.read().decode().strip())

# Verificar se tem o padrão correto
stdin, stdout, stderr = ssh.exec_command('grep -q "datasources" /var/www/botia/apps/backend/dist/shared/prisma.service.js 2>/dev/null && echo "✅ CÓDIGO CORRIGIDO" || echo "⚠️  Pode estar antigo"')
result = stdout.read().decode().strip()
print(result)

ssh.close()
