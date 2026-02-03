#!/usr/bin/env python3
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
    err = stderr.read().decode('utf-8', errors='ignore')
    client.close()
    return out, err

print("\n[INICIAR BACKEND - VERSÃO FINAL]")
print("="*70 + "\n")

print("[1] Parar processos antigos")
ssh("pkill -f 'node dist/main'", 5)
time.sleep(1)
print("✓ Limpo\n")

print("[2] Iniciar Node.js diretamente")
out, err = ssh("cd /app/apps/backend && node dist/main.js > /tmp/nest.log 2>&1 &", 5)
print("✓ Iniciado em background\n")

print("[3] Aguardar 5 segundos...")
time.sleep(5)

print("\n[4] Verificar processo")
out, _ = ssh("ps aux | grep 'node dist/main' | grep -v grep")
print(out if out.strip() else "Processando...")

print("\n[5] Ver últimos logs (20 linhas)")
out, _ = ssh("tail -20 /tmp/nest.log", 10)
print(out[-800:] if len(out) > 800 else out)

print("\n[6] Testar health endpoint")
out, _ = ssh("curl -s http://localhost:3000/health 2>&1 | head -5", 10)
print(f"Response: {out if out.strip() else '(Aguarde...)'}")

print("\n[7] Verificar porta 3000")
out, _ = ssh("netstat -tlnp 2>/dev/null | grep 3000 || ss -tlnp 2>/dev/null | grep 3000", 5)
print(out if out.strip() else "Porta ainda não aberta")

print("\n" + "="*70)
print("\nDICAS SE NÃO FUNCIONAR:")
print("  • Ver logs completos: tail -100 /tmp/nest.log")
print("  • Matar processo: pkill -f 'node dist/main'")
print("  • Conectar SSH e testar manualmente")
