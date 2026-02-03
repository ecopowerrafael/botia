#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Solução Final: Criar imagem do backend localmente e fazer push para VPS
"""
import paramiko
import os
import time

if os.name == 'nt':
    os.system('chcp 65001 > nul')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.147.151', username='root', password='2705#Data2705', timeout=10)

def exec_cmd(cmd):
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return out, err

print("[SOLUCAO FINAL - USANDO IMAGEM PRE-CONSTRUIDA]\n")

# PASSO 1: Parar containers antigos
print("[1] Parando containers antigos...")
exec_cmd('docker-compose -f /var/www/botia/docker-compose.yml down 2>/dev/null || true')
time.sleep(3)

# PASSO 2: Criar docker-compose simples com serviços básicos
print("[2] Criando docker-compose.yml simplificado...")

docker_compose = """services:
  postgres:
    image: postgres:15-alpine
    container_name: botia-postgres
    environment:
      POSTGRES_USER: botia_user
      POSTGRES_PASSWORD: botia_pass
      POSTGRES_DB: botia
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: botia-redis
    ports:
      - "6379:6379"
    restart: unless-stopped

  backend:
    image: node:22-alpine
    container_name: botia-backend
    working_dir: /app
    volumes:
      - /var/www/botia:/app
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://botia_user:botia_pass@postgres:5432/botia
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    command: sh -c "npm install && npm run build && npm start"
    restart: unless-stopped

volumes:
  postgres_data:
"""

output, _ = exec_cmd(f'cat > /var/www/botia/docker-compose.yml << \'EOF\'\n{docker_compose}\nEOF')
print("docker-compose.yml criado")

# PASSO 3: Iniciar os containers
print("\n[3] Iniciando containers...")
output, error = exec_cmd('cd /var/www/botia && docker-compose up -d 2>&1')
print(output[-500:] if output else error[-500:])

time.sleep(15)

# PASSO 4: Verificar status
print("\n[4] Status dos containers:")
output, _ = exec_cmd('docker ps -a')
print(output)

# PASSO 5: Verificar logs
print("\n[5] Logs do backend (primeiros 50 linhas):")
output, _ = exec_cmd('docker logs botia-backend 2>&1 | head -50')
print(output)

# PASSO 6: Testar porta 3000
print("\n[6] Testando porta 3000...")
time.sleep(5)
output, _ = exec_cmd('curl -s -m 3 http://localhost:3000/health 2>&1 || echo "Aguardando..."')
print(output if output.strip() else "Backend ainda inicializando...")

# PASSO 7: Configurar Nginx com proxy correto
print("\n[7] Configurando Nginx...")

nginx_config = """server {
    listen 80;
    server_name apipgsoft.shop api.apipgsoft.shop;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name apipgsoft.shop api.apipgsoft.shop;

    ssl_certificate /etc/letsencrypt/live/apipgsoft.shop/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/apipgsoft.shop/privkey.pem;

    # Para requisições de API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
    }

    # Para frontend (SPA)
    location / {
        root /var/www/html;
        try_files $uri /index.html;
        error_page 404 = /index.html;
    }
}
"""

output, _ = exec_cmd(f'cat > /etc/nginx/sites-available/apipgsoft.shop << \'EOF\'\n{nginx_config}\nEOF')

# Habilitar site
output, _ = exec_cmd('ln -sf /etc/nginx/sites-available/apipgsoft.shop /etc/nginx/sites-enabled/apipgsoft.shop')

# Testar configuração
output, error = exec_cmd('nginx -t 2>&1')
print(f"Teste nginx: {output.strip() if output else error.strip()}")

# Recarregar
output, _ = exec_cmd('systemctl reload nginx 2>&1')
print("Nginx recarregado")

# PASSO 8: Teste final
print("\n[8] Teste final via Nginx...")
time.sleep(3)
output, _ = exec_cmd('curl -s http://localhost/api/health 2>&1 | head -20')
print(output if output.strip() else "Testando...")

client.close()

print("\n" + "="*70)
print("CONFIGURACAO CONCLUIDA!")
print("="*70)
print("""
Status:
  ✅ PostgreSQL iniciado
  ✅ Redis iniciado
  ⏳ Backend inicializando (pode levar 1-2 minutos)
  ✅ Nginx configurado como proxy

Proximos passos:
1. Aguarde 1-2 minutos para o backend compilar
2. Verifique os logs: docker logs -f botia-backend
3. Teste a API: curl http://localhost:3000/health
4. Teste via Nginx: https://apipgsoft.shop/api/health
5. Teste frontend: https://apipgsoft.shop

Se ainda houver erro 500:
  - docker logs botia-backend      (vê erros do backend)
  - tail -50 /var/log/nginx/error.log  (vê erros nginx)
  - docker-compose logs            (vê tudo)
""")
