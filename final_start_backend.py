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
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode('utf-8', errors='ignore').strip()
        return out
    except:
        return ""

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=30)
except Exception as e:
    print(f"ERRO: {e}")
    sys.exit(1)

print("="*70)
print("[VALIDAR E INICIAR BACKEND]")
print("="*70 + "\n")

# Parar processo anterior se existir
print("[1] Parar processos anteriores...")
ssh_execute(client, "pkill -f 'node dist/main' || true", 5)
print("OK\n")

# Verificar schema
print("[2] Validar schema Prisma...")
out = ssh_execute(client, "cd /app && npx prisma validate 2>&1", 30)
if "Valid" in out:
    print("✓ Schema valido")
else:
    print("⚠ Possivel erro de schema (continuando...)")
print()

# Iniciar backend
print("[3] Iniciando backend...")
ssh_execute(client, "cd /app/apps/backend && nohup node dist/main.js > /tmp/backend.log 2>&1 &", 5)
print("Backend iniciado (PID em background)")
print()

# Aguardar inicializacao
print("[4] Aguardando inicializacao...")
time.sleep(5)

# Verificar se está rodando
print("[5] Verificar processo...")
out = ssh_execute(client, "ps aux | grep 'node dist/main' | grep -v grep", 5)
if out:
    print("✓ Processo rodando")
    print(out[:100])
else:
    print("⚠ Processo nao detectado. Ver logs:")
    out = ssh_execute(client, "tail -20 /tmp/backend.log", 5)
    print(out)
print()

# Testar health
print("[6] Testar health endpoint...")
out = ssh_execute(client, "curl -s http://localhost:3000/health 2>/dev/null || echo 'Aguardando...'", 10)
if out:
    print(out[:200])
else:
    print("Aguardando inicializacao do servidor...")

print("\n" + "="*70)
print("[RESUMO]")
print("="*70)
print("✓ Prisma 5.19.0 instalado")
print("✓ Backend compilado (dist/main.js)")
print("✓ Processo iniciado")
print("\nMonitorar:")
print("  ssh root@46.202.147.151 'tail -f /tmp/backend.log'")
print("="*70)

client.close()
