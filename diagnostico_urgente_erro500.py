#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import paramiko
import os

if os.name == 'nt':
    os.system('chcp 65001 > nul')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.147.151', username='root', password='2705#Data2705', timeout=10)

print("\n[DIAGNOSTICO URGENTE - ERRO 500 AINDA PRESENTE]\n")

# 1. Docker compose exists?
stdin, stdout, stderr = client.exec_command('test -f /var/www/docker-compose.yml && echo "EXISTS" || echo "NOT_FOUND"')
dc_exists = stdout.read().decode().strip()

print(f"[1] docker-compose.yml: {dc_exists}")

if dc_exists == "EXISTS":
    # Ver conteudo
    stdin, stdout, stderr = client.exec_command('head -20 /var/www/docker-compose.yml')
    print(stdout.read().decode('utf-8', errors='ignore'))
else:
    print("docker-compose.yml NAO ENCONTRADO em /var/www/")
    
    # Ver o que tem em /var/www
    stdin, stdout, stderr = client.exec_command('ls -la /var/www/')
    print("\nConteudo de /var/www/:")
    print(stdout.read().decode('utf-8', errors='ignore'))

# 2. Containers
print("\n[2] Docker containers:")
stdin, stdout, stderr = client.exec_command('docker ps -a')
print(stdout.read().decode('utf-8', errors='ignore'))

# 3. Logs
print("\n[3] Ultimos logs (backend ou erro):")
stdin, stdout, stderr = client.exec_command('docker logs -n 30 backend 2>&1 || echo "Container nao existe"')
output = stdout.read().decode('utf-8', errors='ignore')
print(output[-1500:] if len(output) > 1500 else output)

# 4. Processo
print("\n[4] Processos Node:")
stdin, stdout, stderr = client.exec_command('ps aux | grep -i node | grep -v grep')
print(stdout.read().decode('utf-8', errors='ignore') or "Nenhum")

# 5. Porta
print("\n[5] Porta 3000:")
stdin, stdout, stderr = client.exec_command('netstat -tlnp 2>/dev/null | grep 3000 || echo "Porta 3000 nao tem nada"')
print(stdout.read().decode('utf-8', errors='ignore'))

# 6. Nginx error
print("\n[6] Erros recentes do nginx:")
stdin, stdout, stderr = client.exec_command('tail -20 /var/log/nginx/error.log')
print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
