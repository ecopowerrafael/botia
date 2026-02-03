#!/usr/bin/env python3
import paramiko

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=30)

print("🔍 Verificando conteúdo do prisma.service.js...")

# Procurar pela palavra "datasources" que indica a correção
stdin, stdout, stderr = ssh.exec_command('grep "datasources" /var/www/botia/apps/backend/dist/shared/prisma.service.js | head -3')
result = stdout.read().decode().strip()

if result:
    print(f"✅ ENCONTRADO 'datasources':\n{result}\n")
    print("✅✅✅ CÓDIGO CORRIGIDO JÁ ESTÁ NA VPS!")
else:
    print("❌ NÃO encontrou 'datasources' - arquivo pode estar antigo\n")
    
    # Se não tem, mostra o início do arquivo
    print("Mostrando início do arquivo:")
    stdin, stdout, stderr = ssh.exec_command('head -20 /var/www/botia/apps/backend/dist/shared/prisma.service.js')
    print(stdout.read().decode())

ssh.close()
