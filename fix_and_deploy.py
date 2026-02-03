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
    err = stderr.read().decode()
    return out + err

print("🔧 Reconfigurando infraestrutura Docker...")

print("\n1️⃣  Verificando networks existentes:")
out = run('docker network ls')
print(out[:500])

print("\n2️⃣  Criando network botia-network...")
out = run('docker network create botia-network 2>&1 || echo "Network já existe ou foi criada"')
print(out)

print("\n3️⃣  Verificando containers...")
out = run('docker ps -a --format "{{.Names}}: {{.Status}}"')
print(out)

print("\n4️⃣  Iniciando postgres (se não tiver)...")
out = run('docker start botia-postgres 2>&1 || echo "Já está rodando"')
print(out[:200])

print("\n5️⃣  Iniciando redis (se não tiver)...")
out = run('docker start botia-redis 2>&1 || echo "Já está rodando"')
print(out[:200])

print("\n6️⃣  Removendo backend antigo...")
out = run('docker rm -f botia-backend 2>&1')
print(out[:200])

print("\n7️⃣  Deploy backend...")
cmd = '''docker run -d \\
  --name botia-backend \\
  --network botia-network \\
  --link botia-postgres:botia-postgres \\
  --link botia-redis:botia-redis \\
  -p 3000:3000 \\
  -e NODE_ENV=production \\
  -e DATABASE_URL="postgresql://postgres:postgres2024@botia-postgres:5432/botia_db" \\
  -e REDIS_URL="redis://botia-redis:6379" \\
  -v /var/www/botia/apps/backend/dist:/app/dist \\
  -v /var/www/botia/apps/backend/node_modules:/app/node_modules \\
  node:22-alpine \\
  node /app/dist/main.js
'''

out = run(cmd)
container_id = out.strip()[:12]
print(f"Container ID: {container_id}")

time.sleep(10)

print("\n8️⃣  Status:")
out = run('docker ps -a | grep botia')
print(out)

print("\n9️⃣  Logs backend:")
out = run('docker logs botia-backend 2>&1')
print(out[-1500:] if len(out) > 1500 else out)

ssh.close()
