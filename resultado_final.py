#!/usr/bin/env python3
"""
Ver resultado final
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

print("RESULTADO FINAL")
print("=" * 70)

print("\n[1] Status dos containers:")
print(cmd("docker ps -a | grep botia"))

print("\n[2] Logs do backend (últimas 150 linhas):")
logs = cmd("docker logs botia-backend 2>&1 | tail -150")
print(logs)

print("\n[3] Teste health:")
health = cmd("curl -s http://localhost:3000/health 2>&1")
if "OK" in health or "{" in health:
    print("✅ SUCESSO!")
    print(health)
else:
    print("❌ Ainda não respondendo")
    print(health)

ssh.close()
