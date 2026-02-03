#!/usr/bin/env python3

import paramiko
import sys

HOST = "46.202.147.151"
USER = "root"
PASSWORD = "2705#Data2705"

def ssh_exec(cmd, timeout=180):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='ignore')
    client.close()
    return out

print("[VPS - Recompile Prisma binários para Linux]\n")

print("[1] Remover node_modules Prisma...")
out = ssh_exec("rm -rf /app/node_modules/@prisma* /app/node_modules/.prisma 2>/dev/null; echo OK", 30)
print(out)

print("[2] npm install (vai compilar binários Linux)...")
out = ssh_exec("cd /app && npm install --legacy-peer-deps 2>&1 | tail -5", 300)
print(out)

print("[3] npm install backend...")
out = ssh_exec("cd /app/apps/backend && npm install --legacy-peer-deps 2>&1 | tail -3", 300)
print(out)

print("[4] Generate Prisma (vai funcionar agora)...")
out = ssh_exec("cd /app && npx prisma generate 2>&1 | tail -10", 120)
if "generated" in out.lower() or "client" in out.lower():
    print("✓ Prisma gerado com sucesso!")
    print(out[:300])
else:
    print(out)

print("[5] Rebuild backend...")
out = ssh_exec("cd /app/apps/backend && npm run build 2>&1 | tail -3", 180)
print(out)

print("[6] Iniciar backend...")
ssh_exec("pkill -f 'node dist/main' || true", 5)
ssh_exec("cd /app/apps/backend && nohup node dist/main.js > /tmp/backend.log 2>&1 &", 5)

import time
time.sleep(5)

print("\n[7] Ver status...")
out = ssh_exec("cat /tmp/backend.log | tail -10", 5)
print(out[-400:])

print("\n[CONCLUIDO]")
