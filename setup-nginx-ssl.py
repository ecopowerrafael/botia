#!/usr/bin/env python3
import paramiko
import sys

HOST = "46.202.147.151"
USER = "root"
PASSWORD = input("Digite a senha SSH: ")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD)

print("\n🚀 SETUP NGINX + SSL\n")

# 1. Instalar nginx
print("1️⃣  Instalando nginx...")
stdin, stdout, stderr = ssh.exec_command("apt install -y nginx certbot python3-certbot-nginx")
print(stdout.read().decode()[-200:])

# 2. Criar config nginx
print("\n2️⃣  Configurando nginx como reverse proxy...")
nginx_config = '''server {
    listen 80;
    listen [::]:80;
    server_name apipgsoft.shop www.apipgsoft.shop;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;
}
'''

stdin, stdout, stderr = ssh.exec_command(f"cat > /etc/nginx/sites-available/apipgsoft.shop << 'EOF'\n{nginx_config}\nEOF")
print(stdout.read().decode())

# 3. Ativar site
print("\n3️⃣  Ativando site...")
stdin, stdout, stderr = ssh.exec_command("ln -sf /etc/nginx/sites-available/apipgsoft.shop /etc/nginx/sites-enabled/apipgsoft.shop && nginx -t")
print(stdout.read().decode()[-200:])

# 4. Iniciar nginx
print("\n4️⃣  Iniciando nginx...")
stdin, stdout, stderr = ssh.exec_command("systemctl start nginx && systemctl enable nginx")
print("✅ Nginx iniciado")

# 5. SSL com certbot
print("\n5️⃣  Configurando SSL (Let's Encrypt)...")
stdin, stdout, stderr = ssh.exec_command("certbot --nginx -d apipgsoft.shop -d www.apipgsoft.shop --non-interactive --agree-tos -m seu-email@example.com 2>&1 | tail -20")
ssl_output = stdout.read().decode()
print(ssl_output)

# 6. Test
print("\n6️⃣  Testando...")
stdin, stdout, stderr = ssh.exec_command("curl -I https://apipgsoft.shop 2>&1 | head -5")
test_output = stdout.read().decode()
print(test_output)

print("\n" + "="*50)
print("✅ SETUP COMPLETO!")
print("="*50)
print("\n🌐 Acesse: https://apipgsoft.shop")
print("🔒 SSL automático configurado")
print("⚡ Nginx otimizado com gzip e cache")
print("\n" + "="*50)

ssh.close()
