#!/usr/bin/env python3
"""
Ver logs para entender por que backend não iniciou
"""

import paramiko

HOST = '46.202.147.151'
USER = 'root'
PASSWORD = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=20)

def cmd(c, t=15):
    stdin, stdout, stderr = ssh.exec_command(c, timeout=t)
    return stdout.read().decode()

print("=" * 70)
print("DIAGNOSTICO - POR QUE BACKEND NÃO INICIOU")
print("=" * 70)

print("\n[1] Containers que existem:")
print(cmd("docker ps -a | grep botia"))

print("\n[2] Logs do backend (últimas 100 linhas):")
log = cmd("docker logs botia-backend 2>&1 | tail -100")
if log.strip():
    print(log)
else:
    print("⚠️ Sem logs! Container pode não ter iniciado nem um pouco")

print("\n[3] Verificar se container está rodando:")
print(cmd("docker inspect botia-backend 2>&1 | grep -E 'Status|Error' | head -5"))

print("\n[4] Verificar postgres:")
print(cmd("docker logs botia-postgres 2>&1 | tail -20"))

print("\n[5] Verificar redis:")
print(cmd("docker logs botia-redis 2>&1 | tail -20"))

print("\n[6] Docker events recentes:")
print(cmd("docker events --since 5m 2>&1 | head -50"))

ssh.close()
