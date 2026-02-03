#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import paramiko

HOST = "46.202.147.151"
USER = "root"
PASSWORD = "2705#Data2705"

def ssh(cmd, timeout=30):
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

print("\n[STATUS VPS]")
print("="*70)

print("\n[PM2 Status]")
out = ssh("pm2 status")
print(out)

print("\n[PM2 Logs (últimas 50 linhas)]")
out = ssh("pm2 logs backend --lines 50 --nostream")
print(out)

print("\n[Processo Node]")
out = ssh("ps aux | grep node | grep -v grep")
print(out)

print("\n[Porta 3000 aberta?]")
out = ssh("netstat -tuln | grep 3000 || ss -tuln | grep 3000 || echo 'Nao esta escutando em 3000'")
print(out)

print("\n[Espaço em disco]")
out = ssh("df -h / | tail -1")
print(out)

print("="*70)
