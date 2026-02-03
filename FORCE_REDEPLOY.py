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

print("\n[FORÇA BRUTA - Resolver conflito git]")
print("="*70 + "\n")

steps = [
    ("Parar backend", "pm2 stop backend 2>/dev/null; sleep 2", 15),
    ("Limpar node_modules", "cd /app && rm -rf node_modules apps/*/node_modules 2>/dev/null", 30),
    ("Git reset hard", "cd /app && git reset --hard origin/main 2>&1 | tail -3", 30),
    ("npm install fresh", "cd /app && npm install 2>&1 | tail -3", 300),
    ("Build", "cd /app && npm run build 2>&1 | tail -10", 300),
    ("Restart", "pm2 restart backend || pm2 start 'npm start --workspace=apps/backend' --name backend", 15),
    ("Status", "pm2 status", 10),
]

for i, (name, cmd, timeout) in enumerate(steps, 1):
    print(f"[{i}] {name}...")
    out = ssh(cmd, timeout=timeout)
    lines = out.split('\n')[:3]
    for line in lines:
        if line.strip():
            print(f"    {line[:90]}")
    print()
    time.sleep(1)

print("="*70)
time.sleep(3)
out = ssh("curl -s http://localhost:3000/health 2>/dev/null || echo 'Building...'", 10)
print(f"Health: {out[:100]}")
