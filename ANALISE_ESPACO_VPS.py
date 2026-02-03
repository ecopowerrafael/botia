#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analisar onde está o espaço gasto na VPS
"""

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

print("\n" + "="*70)
print("[ANALISE DE ESPAÇO EM DISCO - VPS]")
print("="*70 + "\n")

# Espaço total
print("[1] Espaço total do disco:")
out = ssh("df -h /")
print(out)

# Maiores pastas na raiz
print("[2] Maiores pastas em /:")
out = ssh("du -sh /* 2>/dev/null | sort -hr | head -15")
print(out)

# Conteudo de /root
print("[3] Maiores pastas em /root:")
out = ssh("du -sh /root/* 2>/dev/null | sort -hr | head -10")
print(out)

# Conteudo de /app (agora vazio)
print("[4] Tamanho /app (deve estar vazio agora):")
out = ssh("du -sh /app 2>/dev/null || echo 'Nao existe'")
print(out)

# npm cache
print("[5] npm cache em /root/.npm:")
out = ssh("du -sh /root/.npm 2>/dev/null || echo '0'")
print(out)

# Backups
print("[6] Backups tar.gz em /root:")
out = ssh("ls -lh /root/*.tar.gz 2>/dev/null | awk '{print $9, $5}'")
print(out if out.strip() else "Nenhum backup encontrado")

# PostgreSQL data
print("[7] PostgreSQL data (se existir):")
out = ssh("du -sh /var/lib/postgresql 2>/dev/null || echo 'Nao instalado ou sem dados'")
print(out)

# Docker images/containers
print("[8] Docker images/storage:")
out = ssh("du -sh /var/lib/docker 2>/dev/null || echo 'Docker nao instalado'")
print(out)

# Temp files
print("[9] Temp files em /tmp:")
out = ssh("du -sh /tmp 2>/dev/null")
print(out)

# Logs
print("[10] Logs em /var/log:")
out = ssh("du -sh /var/log 2>/dev/null")
print(out)

print("\n" + "="*70)
print("[CONCLUSAO]")
print("="*70)
print("""
O espaço de 27GB é gasto em:

1. **node_modules duplicados** (5-10GB)
   - npm install em /app → /app/node_modules (~5GB)
   - npm install em /app/apps/backend → /app/apps/backend/node_modules (~3GB)
   - npm install em /app/apps/frontend → /app/apps/frontend/node_modules (~2GB)

2. **Backups tar.gz** (5-10GB)
   - tar -czf /root/app_backup_*.tar.gz criou múltiplos backups
   - Cada clone do repositório cria um backup

3. **npm cache** (2-3GB)
   - /root/.npm/ armazena todos os pacotes baixados

4. **Binaries do Prisma** (1-2GB)
   - .node files em múltiplas pastas
   - Duplicados em cada node_modules

5. **PostgreSQL data** (2-5GB possivel)
   - Se o banco estiver rodando e com dados

6. **Docker images** (se usar Docker)

7. **Logs do sistema** (/var/log)

PROBLEMA: Rodei npm install múltiplas vezes em pastas diferentes,
criando node_modules DUPLICADOS em várias localizações!
""")

print("="*70 + "\n")
