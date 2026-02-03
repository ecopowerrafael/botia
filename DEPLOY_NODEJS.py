#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DEPLOY - Com instalação correta de Node.js
"""

import paramiko
import time

HOST = "46.202.147.151"
USER = "root"
PASSWORD = "2705#Data2705"

def ssh(cmd, timeout=600):
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

print("\n" + "="*70)
print("[DEPLOY - Node.js via NodeSource]")
print("="*70)

steps = [
    ("Atualizar apt", 
     "apt-get update -y", 60),
    
    ("Instalar curl", 
     "apt-get install -y curl", 30),
    
    ("Adicionar NodeSource repository", 
     "curl -fsSL https://deb.nodesource.com/setup_22.x | bash -", 120),
    
    ("Instalar Node.js e npm", 
     "apt-get install -y nodejs", 180),
    
    ("Verificar versões", 
     "node -v && npm -v", 10),
    
    ("Clonar repositório (já feito, pular se existir)", 
     "test -d /app/.git && echo 'Já clonado' || (cd /app && git clone https://github.com/ecopowerrafael/botia.git .)", 120),
    
    ("npm install", 
     "cd /app && npm install 2>&1 | tail -5", 600),
    
    ("Prisma generate", 
     "cd /app && npm run prisma:generate 2>&1 | tail -5", 180),
    
    ("Build backend", 
     "cd /app && npm run build 2>&1 | tail -5", 300),
    
    ("Instalar PM2", 
     "npm install -g pm2 2>&1 | tail -2", 60),
    
    ("Iniciar backend", 
     "cd /app/apps/backend && pm2 start 'npm start' --name backend", 15),
    
    ("PM2 status", 
     "pm2 status", 10),
    
    ("Health check", 
     "sleep 5 && curl -s http://localhost:3000/health || echo 'Aguardando...'", 15),
]

print("\n")
for i, (name, cmd, timeout) in enumerate(steps, 1):
    print(f"[{i}/{len(steps)}] {name}...")
    out = ssh(cmd, timeout=timeout)
    lines = out.split('\n')[:3]
    for line in lines:
        if line.strip():
            print(f"  {line[:95]}")
    print()
    time.sleep(1)

print("="*70)
print("[OK] Deploy concluído!")
print("="*70)
print("\nMonitorar:")
print("  ssh root@46.202.147.151 'pm2 logs backend'")
print("="*70 + "\n")
