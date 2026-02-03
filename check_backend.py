#!/usr/bin/env python3
import paramiko

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=30)

print("="*60)
print("VERIFICAÇÃO DO BACKEND")
print("="*60)

# Status
print("\n📋 Status do container:")
stdin, stdout, stderr = ssh.exec_command('docker ps -a | grep botia-backend')
status = stdout.read().decode().strip()
print(status if status else "Sem containers")

# Logs detalhados
print("\n📜 Logs completos do container:")
stdin, stdout, stderr = ssh.exec_command('docker logs botia-backend 2>&1')
logs = stdout.read().decode()
print(logs)

# Análise
print("\n" + "="*60)
print("ANÁLISE:")
print("="*60)

if 'Listening' in logs or 'listening' in logs:
    print("✅ Backend está RODANDO!")
elif 'PrismaClientInitializationError' in logs:
    print("❌ Ainda tem erro de Prisma")
elif 'Cannot find module' in logs:
    print("❌ Erro de módulo")
elif 'Exited' in status:
    print("❌ Container foi finalizado - verificar logs acima")
elif 'Created' in status:
    print("⏳ Container ainda iniciando...")
else:
    print("❓ Status desconhecido - verificar logs acima")

ssh.close()
