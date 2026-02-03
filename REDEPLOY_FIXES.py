#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import paramiko
import time

HOST = "46.202.147.151"
USER = "root"
PASSWORD = "2705#Data2705"

def ssh(cmd, timeout=300):
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
print("[REDEPLOY - Após correções]")
print("="*70)

steps = [
    ("Parar backend", "pm2 stop backend; sleep 2", 15),
    ("Git pull (pegar correções)", "cd /app && git pull origin main 2>&1 | tail -5", 60),
    ("npm install", "cd /app && npm install 2>&1 | tail -3", 180),
    ("Build", "cd /app && npm run build 2>&1 | tail -10", 180),
    ("Iniciar backend", "cd /app && pm2 restart backend 2>&1", 15),
    ("Aguardar inicialização", "sleep 5", 5),
    ("Ver status", "pm2 status", 10),
    ("Ver logs (primeiras 30 linhas)", "pm2 logs backend --lines 30 --nostream", 10),
]

print()
for i, (name, cmd, timeout) in enumerate(steps, 1):
    print(f"[{i}/{len(steps)}] {name}...")
    out = ssh(cmd, timeout=timeout)
    lines = out.split('\n')[:6]
    for line in lines:
        if line.strip():
            print(f"  {line[:95]}")
    print()
    time.sleep(1)

print("="*70)
print("[TESTE]")
print("="*70)
out = ssh("curl -s http://localhost:3000/health 2>/dev/null || echo 'Aguardando...'", 10)
print(f"\nHealth: {out[:200] if out else 'Ainda iniciando...'}")

print("\n" + "="*70)
print("[CONCLUIDO]")
print("="*70 + "\n")
