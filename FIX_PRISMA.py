#!/usr/bin/env python3
import paramiko
import time

HOST = "46.202.147.151"
USER = "root"
PASSWORD = "2705#Data2705"

def ssh(cmd, timeout=60):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='ignore')
    client.close()
    return out

print("[1] Deletar caches")
ssh("rm -rf /app/node_modules/.prisma", 15)
ssh("rm -rf /app/node_modules/@prisma", 15)
print("✓ Deletado\n")

print("[2] Reinstalar @prisma/client")
out = ssh("cd /app && npm install @prisma/client@5.19.0 2>&1 | tail -5", 120)
print(out)

print("\n[3] Regenerar Prisma")
out = ssh("cd /app && npx prisma generate 2>&1", 60)
lines = out.split('\n')
for line in lines[-15:]:
    if line.strip():
        print(line)

print("\n[4] Rebuild backend")
out = ssh("cd /app && npm run build 2>&1 | tail -20", 120)
print(out[-600:] if len(out) > 600 else out)

print("\n✓ Pronto!")
