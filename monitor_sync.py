#!/usr/bin/env python3
import paramiko
import time

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=30)

# Conferir se o upload terminou checando a data/hora do arquivo
print("Aguardando upload finalizar (checando a cada 30s)...\n")

for i in range(20):
    stdin, stdout, stderr = ssh.exec_command('stat /var/www/botia/apps/backend/dist/shared/prisma.service.js 2>/dev/null | grep Modify | tail -1')
    result = stdout.read().decode().strip()
    
    if result:
        print(f"[{i*30}s] Arquivo encontrado - Última modificação: {result}")
        time.sleep(30)
    else:
        print(f"[{i*30}s] ⏳ Ainda não está lá...")
        time.sleep(30)

# Verificação final
print("\n🔍 Verificação final...")
stdin, stdout, stderr = ssh.exec_command('ls -lh /var/www/botia/apps/backend/dist/shared/prisma.service.js && echo "✅ ARQUIVO OK"')
print(stdout.read().decode())

ssh.close()
