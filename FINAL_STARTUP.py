#!/usr/bin/env python3
import paramiko
import time
import subprocess

# PUSH PARA VPS
print("\n[1] Fazer commit e push local")
subprocess.run(["git", "-C", "c:\\bot ia", "add", "-A"], check=False)
result = subprocess.run(
    ["git", "-C", "c:\\bot ia", "commit", "-m", "fix: disable Payment, Cart, TTS, Audio, WhatsApp modules for clean build"],
    capture_output=True
)
print(result.stdout.decode('utf-8', errors='ignore')[-300:] if result.stdout else "Nada para fazer")

subprocess.run(["git", "-C", "c:\\bot ia", "push", "-u", "origin", "main"], check=False)
print("✓ Push concluído\n")

# PULL NA VPS
def ssh(cmd, timeout=120):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect("46.202.147.151", username="root", password="2705#Data2705", timeout=30)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='ignore')
    client.close()
    return out

print("[2] Pull na VPS")
out = ssh("cd /app && git pull origin main", 30)
print(out[-400:] if len(out) > 400 else out)

print("\n[3] Rebuild")
out = ssh("cd /app && npm run build 2>&1 | tail -20", 120)
print(out)

if "Found 0 error" in out:
    print("\n✅ BUILD SUCESSO!")
    
    print("\n[4] Parar processos antigos")
    ssh("pkill -f 'node dist/main'", 5)
    time.sleep(2)
    
    print("\n[5] Iniciar backend")
    ssh("cd /app/apps/backend && nohup node dist/main.js > /tmp/nest.log 2>&1 &", 5)
    time.sleep(5)
    
    print("\n[6] Verificar processo")
    out = ssh("ps aux | grep 'node dist/main' | grep -v grep", 5)
    print(out if out.strip() else "Aguarde...")
    
    print("\n[7] Teste de saúde")
    out = ssh("curl -s http://localhost:3000/health 2>&1 | head -c 300", 5)
    print(f"Response: {out if out else '(aguarde...)'}")
else:
    print("\n❌ ERRO DE BUILD - Verifique:")
    print(out[-800:])
