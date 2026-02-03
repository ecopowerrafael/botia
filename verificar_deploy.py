#!/usr/bin/env python3
"""
Verificação pós-deploy
Confirma que tudo está rodando
"""

import paramiko
import time

HOST = '46.202.147.151'
USER = 'root'
PASSWORD = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

print("VERIFICAÇÃO PÓS-DEPLOY")
print("=" * 70)

ssh.connect(HOST, username=USER, password=PASSWORD, timeout=20)

def cmd(c):
    stdin, stdout, stderr = ssh.exec_command(c, timeout=15)
    return stdout.read().decode()

print("\n[1] Status dos containers:")
print(cmd("docker ps -a"))

print("\n[2] Teste de saúde do backend:")
result = cmd("curl -s http://localhost:3000/health 2>&1")
print(result if result else "Sem resposta ainda")

print("\n[3] Porta 3000 respondendo?")
print(cmd("netstat -tlnp 2>/dev/null | grep 3000 || ss -tlnp 2>/dev/null | grep 3000 || echo 'Nao encontrado'"))

print("\n[4] Ultimos logs (backend):")
print(cmd("docker logs botia-backend 2>&1 | tail -20"))

print("\n[5] Teste nginx → api:")
print(cmd("curl -s -I https://apipgsoft.shop/api/health | head -5"))

ssh.close()

print("\n" + "=" * 70)
print("✅ VERIFICAÇÃO COMPLETA")
print("=" * 70)
print("\nSe viu respostas JSON ou HTTP 200, está funcionando!")
