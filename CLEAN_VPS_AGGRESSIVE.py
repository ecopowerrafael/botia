#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LIMPEZA AGRESSIVA DA VPS - Remover tudo que nao eh necessario
"""

import paramiko

HOST = "46.202.147.151"
USER = "root"
PASSWORD = "2705#Data2705"

def ssh(cmd, timeout=180):
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode('utf-8', errors='ignore')
        client.close()
        return out.strip()
    except Exception as e:
        return f"ERRO: {str(e)}"

print("\n" + "="*70)
print("[LIMPEZA AGRESSIVA - VPS]")
print("="*70)

# Antes
print("\n[ANTES] Espaço usado:")
out = ssh("df -h / | tail -1")
print(out)

steps = [
    ("Parar todos processos node/npm", 
     "pkill -9 node; pkill -9 npm; pkill -9 pm2; sleep 2; true", 10),
    
    ("Remover /app completamente",
     "rm -rf /app /root/app_backup_*.tar.gz 2>/dev/null; echo OK", 30),
    
    ("Limpar npm cache global",
     "npm cache clean --force 2>/dev/null; rm -rf /root/.npm 2>/dev/null; echo OK", 30),
    
    ("Limpar npm temp",
     "rm -rf /root/.npm /root/.npx 2>/dev/null; echo OK", 10),
    
    ("Limpar /tmp (lixo de scripts)",
     "rm -rf /tmp/* /tmp/.* 2>/dev/null; echo OK", 10),
    
    ("Limpar apt cache (se usar apt)",
     "apt-get clean 2>/dev/null; apt-get autoclean 2>/dev/null; apt-get autoremove -y 2>/dev/null; echo OK", 60),
    
    ("Limpar Docker (se estiver usando)",
     "docker system prune -a -f 2>/dev/null || echo 'Docker nao instalado'", 60),
    
    ("Limpar journal logs (antigos)",
     "journalctl --vacuum=50M 2>/dev/null || echo 'Journal nao disponivel'", 30),
    
    ("Limpar /var/log (manter estrutura)",
     "find /var/log -type f -delete 2>/dev/null; echo OK", 30),
]

for name, cmd, timeout in steps:
    print(f"\n[{name}]")
    out = ssh(cmd, timeout=timeout)
    if "OK" in out or "nao" in out or "not found" in out.lower():
        print("  ✓")
    else:
        print(f"  {out[:80]}")

# Depois
print("\n\n[DEPOIS] Espaço usado:")
out = ssh("df -h / | tail -1")
print(out)

# Verificar o que sobrou
print("\n[ESTRUTURA FINAL]")
out = ssh("du -sh /* 2>/dev/null | sort -hr | head -10")
print(out)

print("\n" + "="*70)
print("[PRONTO PARA DEPLOY LIMPO]")
print("="*70 + "\n")
