#!/usr/bin/env python3
import paramiko
import time

host = '46.202.147.151'
user = 'root'
password = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=30)

def run_cmd(cmd, wait=2):
    stdin, stdout, stderr = ssh.exec_command(cmd)
    time.sleep(wait)
    out = stdout.read().decode()
    err = stderr.read().decode()
    return out, err

print("🧹 Limpando containers antigos...")
out, err = run_cmd('docker rm -f botia-backend 2>&1')

print("🚀 Deploy SIMPLES do backend...")

# Deploy mais simples possível
cmd = '''docker run -d \\
  --name botia-backend \\
  --network botia-network \\
  -p 3000:3000 \\
  -e NODE_ENV=production \\
  -e DATABASE_URL="postgresql://postgres:postgres2024@botia-postgres:5432/botia_db" \\
  -e REDIS_URL="redis://botia-redis:6379" \\
  -v /var/www/botia/apps/backend/dist:/app/dist \\
  -v /var/www/botia/apps/backend/node_modules:/app/node_modules \\
  node:22-alpine \\
  node /app/dist/main.js
'''

out, err = run_cmd(cmd, 3)
print(f"Container ID: {out.strip()[:12]}")

time.sleep(10)

print("\n📋 Status:")
out, _ = run_cmd('docker ps -a | grep botia-backend')
print(out)

print("\n📜 Logs:")
out, _ = run_cmd('docker logs botia-backend', 2)
print(out[-1000:] if len(out) > 1000 else out)

ssh.close()
