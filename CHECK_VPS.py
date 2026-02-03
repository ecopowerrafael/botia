#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verificar estado da VPS após formatação
"""

import paramiko

HOST = "46.202.147.151"
USER = "root"
PASSWORD = "2705#Data2705"

def ssh(cmd, timeout=30):
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode('utf-8', errors='ignore')
        client.close()
        return out
    except Exception as e:
        return f"ERRO: {str(e)}"

print("\n" + "="*70)
print("[VERIFICACAO VPS - POS FORMATACAO]")
print("="*70 + "\n")

checks = [
    ("Conectar SSH", "echo 'Conectado com sucesso'"),
    ("Espaço em disco", "df -h /"),
    ("Listar /", "ls -la /"),
    ("Listar /app (se existir)", "ls -la /app 2>/dev/null || echo 'Nao existe /app'"),
    ("Listar /root", "ls -la /root 2>/dev/null || echo 'Nao existe /root'"),
    ("Ver Node version", "node --version 2>/dev/null || echo 'Node nao instalado'"),
    ("Ver npm version", "npm --version 2>/dev/null || echo 'npm nao instalado'"),
    ("Ver Git version", "git --version 2>/dev/null || echo 'Git nao instalado'"),
]

for name, cmd in checks:
    print(f"[{name}]")
    out = ssh(cmd)
    lines = out.split('\n')[:5]
    for line in lines:
        if line.strip():
            print(f"  {line[:95]}")
    print()

print("="*70)
print("[RESUMO]")
print("="*70)
