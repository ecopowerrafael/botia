#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import paramiko
import time

HOST = "46.202.147.151"
USER = "root"
PASSWORD = "2705#Data2705"

def ssh(cmd, timeout=30):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='ignore')
    client.close()
    return out

print("\n[INICIAR BACKEND CORRETAMENTE]")
print("="*70 + "\n")

print("[1] Parar PM2")
ssh("pm2 kill", 15)
print("OK")

print("\n[2] Iniciar node direto")
out = ssh("cd /app/apps/backend && nohup node dist/main.js > /tmp/backend.log 2>&1 &", 5)
print("Iniciado em background")

print("\n[3] Aguardar...")
time.sleep(5)

print("\n[4] Verificar processo")
out = ssh("ps aux | grep 'node dist/main' | grep -v grep")
print(out if out.strip() else "Ainda iniciando...")

print("\n[5] Ver logs")
out = ssh("tail -50 /tmp/backend.log", 10)
print(out[-1000:])

print("\n[6] Health check")
time.sleep(3)
out = ssh("curl -s http://localhost:3000/health | head -c 200", 10)
print(f"Response: {out if out else 'Sem resposta ainda'}")

print("\n" + "="*70)
