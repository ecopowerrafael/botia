#!/usr/bin/env python3
import paramiko

HOST = "46.202.147.151"
USER = "root"
PASSWORD = "2705#Data2705"

def ssh(cmd):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD)
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    client.close()
    return out, err

print("[1] Verificar estrutura /app")
out, _ = ssh("find /app -name 'main.js' -o -name '*.ts' | head -20")
print(out)

print("\n[2] Verificar se /app/apps/backend/dist existe")
out, _ = ssh("ls -la /app/apps/backend/ | head -20")
print(out)

print("\n[3] Verificar package.json backend")
out, _ = ssh("cat /app/apps/backend/package.json | grep -A 3 'scripts'")
print(out)

print("\n[4] Tentar build novamente")
out, err = ssh("cd /app && npm run build 2>&1 | tail -50")
print(out)
if err:
    print("ERRO:", err)

print("\n[5] Ver dist/")
out, _ = ssh("ls -la /app/apps/backend/dist/ 2>&1 | head -20")
print(out)
