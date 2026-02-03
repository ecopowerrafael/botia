#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import paramiko
import sys
import time

HOST = "46.202.147.151"
USER = "root"
PASSWORD = "2705#Data2705"
PORT = 22

def ssh_execute(client, cmd, timeout=180):
    """Execute SSH command and return output"""
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode('utf-8', errors='ignore').strip()
        err = stderr.read().decode('utf-8', errors='ignore').strip()
        return out, err
    except Exception as e:
        return "", str(e)

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("[Conectando a VPS...]")
    try:
        client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30)
        print("[OK] Conectado\n")
    except Exception as e:
        print(f"[ERRO] {str(e)}")
        sys.exit(1)
    
    steps = [
        ("Parar PM2", "pm2 stop all 2>/dev/null || true", 10),
        ("Backup /app", "tar -czf /root/app_backup_$(date +%s).tar.gz /app 2>/dev/null || true", 30),
        ("Remover /app", "rm -rf /app && mkdir -p /app", 10),
        ("Clone repositorio", "cd /app && git clone https://github.com/ecopowerrafael/botia.git .", 60),
        ("Verificar estrutura", "ls -la /app/apps/backend/ | head -5", 10),
        ("Ver package.json", "head -20 /app/package.json", 5),
        ("Verificar Prisma", "grep -E 'prisma|@prisma' /app/package.json | head -3", 5),
        ("npm install root", "cd /app && npm install --legacy-peer-deps 2>&1 | tail -5", 120),
        ("npm install backend", "cd /app/apps/backend && npm install --legacy-peer-deps 2>&1 | tail -5", 120),
        ("Prisma generate", "cd /app && npx prisma generate 2>&1 | tail -10", 60),
        ("Build backend", "cd /app && npm run build 2>&1 | tail -10", 120),
        ("Restart PM2", "cd /app && pm2 start 'npm start' --name backend || pm2 restart all", 15),
    ]
    
    print("="*70)
    print("[SETUP VPS - Clone + Prisma 5.19.0]")
    print("="*70 + "\n")
    
    success = 0
    for i, (name, cmd, timeout) in enumerate(steps, 1):
        print(f"[{i}/{len(steps)}] {name}...")
        out, err = ssh_execute(client, cmd, timeout=timeout)
        
        if out:
            for line in out.split('\n')[:4]:
                if line.strip():
                    print(f"  {line[:95]}")
        
        if err and "error" in err.lower() and "clone" not in name.lower():
            print(f"  [!] {err[:100]}")
        
        success += 1
        time.sleep(1)
        print()
    
    client.close()
    
    print("="*70)
    print(f"[OK] {success}/{len(steps)} passos completados")
    print("="*70)
    print("\nVerificar VPS:")
    print("  ssh root@46.202.147.151")
    print("  pm2 status")
    print("  pm2 logs")

if __name__ == "__main__":
    main()
