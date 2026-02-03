#!/usr/bin/env python3
import paramiko
import time

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=30)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    time.sleep(2)
    out = stdout.read().decode()
    return out

print("="*60)
print("DEPLOY FINAL DO BACKEND")
print("="*60)

print("\n1️⃣  Removendo container antigo...")
run('docker rm -f botia-backend')

print("2️⃣  Deploying backend...")
cmd = '''docker run -d \\
  --name botia-backend \\
  --network botia-network \\
  --link botia-postgres:botia-postgres \\
  --link botia-redis:botia-redis \\
  -p 3000:3000 \\
  -e NODE_ENV=production \\
  -e DATABASE_URL="postgresql://postgres:postgres2024@botia-postgres:5432/botia_db" \\
  -e REDIS_URL="redis://botia-redis:6379" \\
  -e JWT_SECRET="jwt-secret-key-2024" \\
  -v /var/www/botia/apps/backend:/backend \\
  node:22-alpine \\
  sh -c "cd /backend && node dist/main.js"
'''

out = run(cmd)
container = out.strip()[:12]
print(f"Container: {container}")

time.sleep(15)

print("\n3️⃣  Status:")
out = run('docker ps -a | grep botia-backend | head -1')
print(out[:150] or "Não encontrado")

print("\n4️⃣  Logs:")
out = run('docker logs botia-backend 2>&1')
print(out[-1500:] if len(out) > 1500 else out)

print("\n" + "="*60)
if 'listening' in out.lower() or '[nest]' in out.lower():
    print("✅✅✅ BACKEND ESTÁ RODANDO!!!")
    print("="*60)
    print("\nTeste via Nginx:")
    print("  https://apipgsoft.shop/api/health")
elif 'Cannot find module' in out:
    print("❌ Módulos faltando")
elif 'Exited' in out or 'exit' in out.lower():
    print("❌ Container saiu - verificar logs acima")
else:
    print("⏳ Verificando...")

ssh.close()
