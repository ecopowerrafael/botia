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

print("\n[FINAL BUILD - com WhatsApp desabilit]")
print("="*70 + "\n")

steps = [
    ("Parar PM2", "pm2 kill", 10),
    ("Git pull simples", "cd /app && git pull", 30),
    ("Rebuild", "cd /app && npm run build 2>&1 | tail -15", 300),
    ("Iniciar", "cd /app && pm2 start 'npm start --workspace=apps/backend' --name backend", 15),
    ("Logs", "sleep 5 && pm2 logs backend --lines 50 --nostream", 20),
]

for i, (name, cmd, timeout) in enumerate(steps, 1):
    print(f"[{i}] {name}...")
    out = ssh(cmd, timeout=timeout)
    lines = out.split('\n')[:10]
    for line in lines:
        if line.strip() and len(line.strip()) > 10:
            print(f"  {line[:90]}")
    print()
    time.sleep(1)

print("="*70)
