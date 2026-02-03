#!/usr/bin/env python3
import paramiko

HOST = "46.202.147.151"
USER = "root"
PASSWORD = "2705#Data2705"

def ssh(cmd):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
    out = stdout.read().decode('utf-8', errors='ignore')
    client.close()
    return out

# Ver logs do backend
print("\n[LOGS DO BACKEND]")
out = ssh("pm2 logs backend --lines 50 2>&1")
print(out[:1000])

print("\n[HEALTH CHECK]")
out = ssh("curl -s http://localhost:3000/health 2>/dev/null || echo 'Nao conectado'")
print(out[:300])
