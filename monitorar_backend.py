#!/usr/bin/env python3
import paramiko
import time
import os

if os.name == 'nt':
    os.system('chcp 65001 > nul')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.147.151', username='root', password='2705#Data2705', timeout=10)

print("[MONITORANDO INICIALIZACAO - 2 MINUTOS]\n")

for tentativa in range(10):
    print(f"[{tentativa + 1}/10] Tentativa de conexao...")
    time.sleep(15)
    
    # Status
    stdin, stdout, stderr = client.exec_command('docker ps --format "table {{.Names}}\t{{.Status}}"')
    output = stdout.read().decode('utf-8', errors='ignore')
    print(output)
    
    # Teste
    stdin, stdout, stderr = client.exec_command('curl -s -m 2 http://localhost:3000/health 2>&1')
    response = stdout.read().decode('utf-8', errors='ignore')
    
    if response and 'refused' not in response.lower():
        print("[SUCESSO] Backend respondendo!")
        print(response[:300])
        break
    else:
        print("[Aguardando...]\n")

# Logs
print("\n[LOGS DO BACKEND - ULTIMAS 20 LINHAS]")
stdin, stdout, stderr = client.exec_command('docker logs botia-backend 2>&1 | tail -20')
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
