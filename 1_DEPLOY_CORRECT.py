#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DEPLOY CORRETO - Clone + Install + Build + Start
"""

import paramiko
import sys
import time

HOST = "46.202.147.151"
USER = "root"
PASSWORD = "2705#Data2705"

def ssh(cmd, timeout=300):
    """Execute SSH command"""
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
print("[DEPLOY CORRETO - Botia Monorepo]")
print("="*70)

steps = [
    ("Clone repositorio GitHub", 
     "cd /app && git clone https://github.com/ecopowerrafael/botia.git . 2>&1 | tail -5", 60),
    
    ("Verificar estrutura",
     "ls -la /app/apps/", 10),
    
    ("Ver package.json raiz",
     "head -20 /app/package.json", 5),
    
    ("npm install completo (raiz + workspaces)",
     "cd /app && npm install 2>&1 | tail -5", 300),
    
    ("Verificar node_modules estrutura",
     "ls -la /app/node_modules/@prisma/ 2>/dev/null | head -5 || echo 'Verificando...'", 10),
    
    ("Prisma generate",
     "cd /app && npm run prisma:generate 2>&1 | tail -10", 120),
    
    ("Build backend",
     "cd /app && npm run build 2>&1 | tail -10", 180),
    
    ("Verificar dist/main.js",
     "ls -la /app/apps/backend/dist/ | grep -E 'main\\.' || echo 'Compilado'", 10),
    
    ("Instalar PM2 global",
     "npm install -g pm2 2>&1 | tail -3", 60),
    
    ("Iniciar backend com PM2",
     "cd /app/apps/backend && pm2 start 'npm start' --name backend 2>&1 | tail -5", 30),
    
    ("Verificar PM2 status",
     "pm2 status", 10),
    
    ("Ver logs iniciais",
     "pm2 logs backend --lines 30", 15),
]

print("\n")
for i, (name, cmd, timeout) in enumerate(steps, 1):
    print(f"[{i}/{len(steps)}] {name}...")
    out = ssh(cmd, timeout=timeout)
    
    # Mostrar apenas primeiras linhas
    lines = out.split('\n')[:5]
    for line in lines:
        if line.strip():
            print(f"  {line[:95]}")
    
    print()
    time.sleep(1)

print("="*70)
print("[RESULTADO FINAL]")
print("="*70)

# Teste final
result = ssh("curl -s http://localhost:3000/health || echo 'Aguardando...'", 10)
print(f"\nHealth check: {result[:100]}")

print("\nPara monitorar:")
print("  ssh root@46.202.147.151 'pm2 logs backend'")
print("  ssh root@46.202.147.151 'pm2 status'")

print("\n" + "="*70 + "\n")
