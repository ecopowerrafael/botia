#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import paramiko

HOST = "46.202.147.151"
USER = "root"
PASSWORD = "2705#Data2705"

def ssh(cmd, timeout=300):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='ignore')
    client.close()
    return out

print("\n[REGENERAR PRISMA]")
print("="*70 + "\n")

# Limpar cache Prisma
print("[1] Limpar .prisma...")
ssh("rm -rf /app/node_modules/.prisma", 30)
print("OK")

# Reinstall @prisma
print("[2] Reinstall @prisma/client...")
out = ssh("cd /app && npm install --save @prisma/client@5.19.0 2>&1 | tail -3", 180)
print(out)

# Generate
print("[3] Generate...")
out = ssh("cd /app && npx prisma generate 2>&1 | tail -20", 120)
print(out)

# Build
print("[4] Build...")
out = ssh("cd /app && npm run build 2>&1 | tail -20", 300)
if "Found 0 error" in out or "Successfully" in out:
    print("✅ BUILD SEM ERROS!")
else:
    print(out)

# Restart
print("[5] Restart...")
out = ssh("pm2 kill; pm2 start 'npm start --workspace=apps/backend' --name backend", 15)
print(out[:200])

print("\n[Aguardando...]")
import time
time.sleep(5)

print("[6] Status...")
out = ssh("pm2 status", 10)
print(out)

print("\n[7] Logs...")
out = ssh("pm2 logs backend --lines 30 --nostream 2>&1", 10)
print(out[:500])

print("\n" + "="*70)
