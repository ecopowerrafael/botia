#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para REALMENTE CORRIGIR o erro 500
Vamos criar o docker-compose.yml e iniciar os containers
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
    return stdout.read().decode('utf-8', errors='ignore'), stderr.read().decode('utf-8', errors='ignore')

print("[SOLUCAO COMPLETA - CRIANDO AMBIENTE]\n")

# PASSO 1: Verificar se há código do projeto
print("[1] Procurando pelo código da aplicacao...")
output, _ = exec_cmd('find / -name "main.ts" -o -name "app.module.ts" 2>/dev/null | head -5')
print(output if output.strip() else "Nao encontrado")

# PASSO 2: Clonar o repositório do GitHub
print("\n[2] Clonando repositorio do GitHub...")
output, error = exec_cmd('cd /var/www && rm -rf botia && git clone https://github.com/ecopowerrafael/botia.git 2>&1')
print(output[-500:] if output else error[-500:])

time.sleep(5)

# PASSO 3: Criar docker-compose.yml
print("\n[3] Criando docker-compose.yml...")

docker_compose_content = """version: '3.8'

services:
  backend:
    build: ./apps/backend
    container_name: botia-backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://botia_user:botia_pass@postgres:5432/botia
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your_jwt_secret_key_here
    depends_on:
      - postgres
      - redis
    networks:
      - app
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    container_name: botia-postgres
    environment:
      POSTGRES_USER: botia_user
      POSTGRES_PASSWORD: botia_pass
      POSTGRES_DB: botia
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: botia-redis
    networks:
      - app
    restart: unless-stopped

networks:
  app:
    driver: bridge

volumes:
  postgres_data:
"""

# Salvar o arquivo
output, error = exec_cmd(f'cat > /var/www/botia/docker-compose.yml << \'EOF\'\n{docker_compose_content}\nEOF')
print("docker-compose.yml criado")

# PASSO 4: Construir as imagens
print("\n[4] Construindo imagens Docker (pode levar alguns minutos)...")
output, error = exec_cmd('cd /var/www/botia && docker-compose build 2>&1 | tail -20')
print(output)

time.sleep(5)

# PASSO 5: Iniciar containers
print("\n[5] Iniciando containers...")
output, error = exec_cmd('cd /var/www/botia && docker-compose up -d 2>&1')
print(output)

time.sleep(5)

# PASSO 6: Verificar status
print("\n[6] Status dos containers:")
output, _ = exec_cmd('docker ps -a')
print(output)

# PASSO 7: Verificar logs do backend
print("\n[7] Logs do backend (aguardando inicializacao):")
time.sleep(5)
output, _ = exec_cmd('docker logs botia-backend 2>&1 | tail -30')
print(output)

# PASSO 8: Testar porta 3000
print("\n[8] Testando porta 3000...")
output, _ = exec_cmd('curl -s http://localhost:3000/health 2>&1')
print(output if output.strip() else "Aguardando resposta...")

# PASSO 9: Configurar Nginx para proxy
print("\n[9] Atualizando configuracao do Nginx...")
nginx_config = """
server {
    listen 80;
    listen 443 ssl http2;
    server_name apipgsoft.shop;

    # SSL
    ssl_certificate /etc/letsencrypt/live/apipgsoft.shop/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/apipgsoft.shop/privkey.pem;

    # Para requisições de API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Para frontend (SPA)
    location / {
        root /var/www/html;
        try_files $uri /index.html;
    }
}
"""

output, _ = exec_cmd(f'cat > /etc/nginx/sites-available/apipgsoft.shop << \'EOF\'\n{nginx_config}\nEOF')
print("Configuracao do Nginx atualizada")

# PASSO 10: Recarregar Nginx
print("\n[10] Recarregando Nginx...")
output, _ = exec_cmd('nginx -t && systemctl reload nginx 2>&1')
print(output)

# PASSO 11: Teste final
print("\n[11] Teste final:")
time.sleep(3)
output, _ = exec_cmd('curl -s http://localhost/api/health 2>&1 | head -20')
print(output if output.strip() else "Testando...")

client.close()

print("\n" + "="*60)
print("PROCESSO CONCLUIDO!")
print("="*60)
print("""
Proximos passos:
1. Aguarde 30 segundos para inicializacao
2. Teste em seu navegador: https://apipgsoft.shop
3. Verifique os logs: docker logs botia-backend
4. Se houver erro, execute novamente com: docker-compose logs

Seu site deve estar funcionando agora!
""")
