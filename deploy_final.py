#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DEPLOY FINAL - VPS FORMATADA DO ZERO
"""

import paramiko
import time

HOST = "46.202.147.151"
USER = "root"
PASSWORD = "2705#Data2705"

def ssh(cmd, timeout=300):
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
print("[DEPLOY FINAL - VPS FORMATADA]")
print("="*70)

steps = [
    ("Atualizar apt", 
     "apt-get update -y 2>&1 | tail -2", 60),
    
    ("Instalar Node.js e npm", 
     "apt-get install -y nodejs npm 2>&1 | tail -2", 120),
    
    ("Verificar versões", 
     "node --version && npm --version", 10),
    
    ("Criar /app", 
     "mkdir -p /app", 5),
    
    ("Clonar repositório", 
     "cd /app && git clone https://github.com/ecopowerrafael/botia.git . 2>&1 | tail -5", 120),
    
    ("Verificar estrutura", 
     "ls -la /app/ | head -10", 5),
    
    ("Verificar package.json", 
     "head -20 /app/package.json", 5),
    
    ("npm install", 
     "cd /app && npm install 2>&1 | tail -5", 300),
    
    ("Prisma generate", 
     "cd /app && npm run prisma:generate 2>&1 | tail -5", 120),
    
    ("Build backend", 
     "cd /app && npm run build 2>&1 | tail -5", 180),
    
    ("Instalar PM2", 
     "npm install -g pm2 2>&1 | tail -2", 60),
    
    ("Iniciar backend com PM2", 
     "cd /app/apps/backend && pm2 start 'npm start' --name backend 2>&1", 15),
    
    ("Ver PM2 status", 
     "pm2 status", 10),
    
    ("Aguardar inicialização", 
     "sleep 5", 5),
    
    ("Health check", 
     "curl -s http://localhost:3000/health || echo 'Aguardando...'", 10),
]

print("\n")
for i, (name, cmd, timeout) in enumerate(steps, 1):
    print(f"[{i}/{len(steps)}] {name}...")
    out = ssh(cmd, timeout=timeout)
    lines = out.split('\n')[:4]
    for line in lines:
        if line.strip():
            print(f"  {line[:95]}")
    print()
    time.sleep(1)

print("="*70)
print("[DEPLOY COMPLETO]")
print("="*70)
print("\nPara monitorar logs:")
print("  ssh root@46.202.147.151")
print("  pm2 logs backend")
print("\nPara checar status:")
print("  pm2 status")
print("="*70 + "\n")
