#!/usr/bin/env python3
import paramiko

HOST = "46.202.147.151"
USER = "root"
PASSWORD = "2705#Data2705"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
stdin, stdout, stderr = client.exec_command("cd /app && npm run build 2>&1", timeout=120)
out = stdout.read().decode('utf-8', errors='ignore')

# Pegar as últimas 50 linhas
lines = out.split('\n')
print('\n'.join(lines[-50:]))

client.close()
