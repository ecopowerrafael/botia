#!/usr/bin/env python3
"""
Redeploy backend com código corrigido
Executar APÓS sync_dist.py terminar
"""
import paramiko
import time

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

def run_cmd(ssh, cmd, wait=5):
    """Execute command and wait"""
    print(f"\n▶️  {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    time.sleep(wait)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if err and 'docker' not in err:
        print(f"⚠️  {err[:200]}")
    if out:
        print(f"✅ {out[:500]}")
    return out

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("🔌 Conectando...")
ssh.connect(host, username=user, password=password, timeout=30)

print("\n" + "="*60)
print("FASE 1: Remover container antigo")
print("="*60)
run_cmd(ssh, 'docker rm -f botia-backend', 3)

print("\n" + "="*60)
print("FASE 2: Deploy novo container com código corrigido")
print("="*60)

deploy_cmd = '''
docker run -d \\
  --name botia-backend \\
  --network botia-network \\
  -p 3000:3000 \\
  -e NODE_ENV=production \\
  -e DATABASE_URL="postgresql://postgres:postgres2024@botia-postgres:5432/botia_db" \\
  -e REDIS_URL="redis://botia-redis:6379" \\
  -e JWT_SECRET="jwt-secret-key-2024" \\
  -e API_PORT=3000 \\
  -v /var/www/botia:/app \\
  node:22-alpine \\
  sh -c "cd /app/apps/backend && node dist/main.js"
'''

run_cmd(ssh, deploy_cmd, 3)

print("\n" + "="*60)
print("FASE 3: Aguardar inicialização (20s)")
print("="*60)
time.sleep(20)

print("\n" + "="*60)
print("FASE 4: Verificações")
print("="*60)

# Status do container
print("\n1️⃣  Status do container:")
run_cmd(ssh, 'docker ps -a | grep botia-backend', 2)

# Logs
print("\n2️⃣  Logs (últimas 30 linhas):")
stdin, stdout, stderr = ssh.exec_command('docker logs botia-backend | tail -30')
logs = stdout.read().decode()
print(logs)

# Teste de conectividade
print("\n3️⃣  Teste de porta 3000:")
run_cmd(ssh, 'curl -s http://localhost:3000/health || echo "Port not responding"', 3)

print("\n" + "="*60)
print("✅ DEPLOY CONCLUÍDO")
print("="*60)
print("\nPróximos passos:")
print("  1. Verificar logs acima")
print("  2. Se OK: testar https://apipgsoft.shop/api/health")
print("  3. Se ERRO: revisar logs para diagnosis")

ssh.close()
