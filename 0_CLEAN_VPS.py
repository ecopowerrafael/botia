#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LIMPEZA COMPLETA DA VPS - Remover tudo e preparar do zero
"""

import paramiko
import sys

HOST = "46.202.147.151"
USER = "root"
PASSWORD = "2705#Data2705"

def ssh(cmd, timeout=180):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='ignore')
    client.close()
    return out

print("\n" + "="*70)
print("[LIMPEZA TOTAL DA VPS]")
print("="*70)

# Parar tudo
print("\n[1] Parando processos...")
ssh("pkill -f node; pkill -f npm; pm2 stop all 2>/dev/null; pm2 kill 2>/dev/null; true", 30)
print("OK")

# Remover aplicação
print("[2] Removendo /app...")
out = ssh("rm -rf /app && mkdir -p /app && ls -la /", 30)
print("OK - /app removido e recriado")

# Limpar cache npm
print("[3] Limpando cache npm...")
ssh("npm cache clean --force 2>/dev/null; rm -rf /root/.npm /root/.cache 2>/dev/null; true", 30)
print("OK")

# Verificar espaço
print("[4] Espaço em disco agora:")
out = ssh("df -h / | tail -1", 10)
print(out.strip())

# Listar o que sobrou
print("[5] Verificar /app vazio:")
out = ssh("ls -la /app", 10)
print(out.strip())

print("\n" + "="*70)
print("[PRONTO] VPS limpa e pronta para nova instalação")
print("="*70 + "\n")
