#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DEPLOY FINAL - Git pull + npm install + build + start
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
print("[DEPLOY FINAL - Git pull + Build + Start]")
print("="*70)

steps = [
    ("Git pull (pegar package.json corrigido)", 
     "cd /app && git pull origin main 2>&1 | grep -E 'package|Already|Updating'", 60),
    
    ("Verificar package.json atualizado", 
     "grep -E 'workspaces|build|prisma:generate' /app/package.json | head -3", 5),
    
    ("npm install (com package.json correto)", 
     "cd /app && npm install 2>&1 | grep -E 'added|packages|audit'", 600),
    
    ("Listar scripts disponíveis", 
     "cd /app && npm run 2>&1 | grep -E 'build|prisma|start'", 10),
    
    ("Prisma generate", 
     "cd /app && npx prisma generate 2>&1 | tail -3", 180),
    
    ("Build backend", 
     "cd /app && npm run build 2>&1 | grep -E 'dist|successfully|error' | head -5", 300),
    
    ("Verificar dist compilado", 
     "ls -la /app/apps/backend/dist/main.js 2>/dev/null || echo 'Nao compilado ainda'", 5),
    
    ("Parar PM2 anterior", 
     "pm2 kill 2>/dev/null; sleep 2; true", 10),
    
    ("Iniciar backend com PM2", 
     "cd /app/apps/backend && pm2 start 'npm start' --name backend 2>&1", 15),
    
    ("Ver PM2 status", 
     "pm2 status 2>&1 | grep -E 'backend|online|error'", 5),
    
    ("Aguardar inicialização", 
     "sleep 8", 10),
    
    ("Health check", 
     "curl -s http://localhost:3000/health 2>/dev/null | head -c 100 || echo 'Aguardando...'", 15),
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
print("[DEPLOY COMPLETO!]")
print("="*70)
print("\nVerificar status:")
print("  ssh root@46.202.147.151 'pm2 status'")
print("  ssh root@46.202.147.151 'pm2 logs backend'")
print("  curl http://46.202.147.151:3000/health")
print("="*70 + "\n")
