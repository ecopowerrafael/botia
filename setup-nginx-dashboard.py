#!/usr/bin/env python3
import paramiko

HOST = "46.202.147.151"
USER = "root"
PASSWORD = input("SSH: ")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD)

print("\n⚙️  Configurando Nginx para servir Dashboard + API...\n")

# Nova config nginx
nginx_config = '''server {
    server_name apipgsoft.shop;

    # Serve arquivos estáticos do dashboard
    root /var/www/html;
    
    # Health check
    location / {
        try_files $uri /index.html;
    }

    # API proxy para NestJS
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Endpoints diretos (sem /api prefix)
    location ~ ^/(tenants|ia|wordpress|conversation|intent|tts|cart|whatsapp|knowledge|automation|users|onboarding|payment|audio|notification|webhook) {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/html;
    gzip_min_length 1000;

    # SSL (Let's Encrypt)
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/apipgsoft.shop/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/apipgsoft.shop/privkey.pem;
}

# Redirecionar HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name apipgsoft.shop;
    return 301 https://$server_name$request_uri;
}
'''

# Atualizar config
stdin, stdout, stderr = ssh.exec_command(f"cat > /etc/nginx/sites-available/apipgsoft.shop << 'EOF'\n{nginx_config}\nEOF")
print("✅ Config nginx atualizada")

# Testar sintaxe
stdin, stdout, stderr = ssh.exec_command("nginx -t")
print(stdout.read().decode()[-100:])

# Reload
stdin, stdout, stderr = ssh.exec_command("systemctl reload nginx")
print("✅ Nginx recarregado")

# Teste
print("\n🔍 Testando...")
stdin, stdout, stderr = ssh.exec_command("curl -s https://apipgsoft.shop | grep -o '<title>.*</title>'")
title = stdout.read().decode().strip()
print(f"✅ {title}")

print("\n" + "="*60)
print("🎉 DASHBOARD ATIVO!")
print("="*60)
print("\n📊 https://apipgsoft.shop")
print("🔗 https://apipgsoft.shop/tenants (API)")
print("\n" + "="*60)

ssh.close()
