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

print("\n[VERIFICACAO FINAL]")
print("="*70)

print("\n[PM2 Status]")
print(ssh("pm2 status"))

print("\n[Processo Node]")
print(ssh("ps aux | grep 'nest start' | grep -v grep"))

print("\n[Aguardando 10 segundos...]")
time.sleep(10)

print("\n[Teste de conexão - Health Check]")
out = ssh("curl -s http://localhost:3000/health 2>/dev/null || curl -s http://127.0.0.1:3000 2>/dev/null || echo 'Ainda iniciando...'", 10)
print(out[:300])

print("\n[Logs completos (últimas 100 linhas)]")
out = ssh("pm2 logs backend --lines 100 --nostream 2>&1", 15)
print(out[-1500:])

print("\n" + "="*70)
