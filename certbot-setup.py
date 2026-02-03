#!/usr/bin/env python3
import paramiko

HOST = "46.202.147.151"
USER = "root"
PASSWORD = input("SSH: ")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD)

print("\n🔒 Configurando SSL...\n")

# Instalar apenas para apipgsoft.shop (sem www por enquanto)
stdin, stdout, stderr = ssh.exec_command("certbot --nginx -d apipgsoft.shop --non-interactive --agree-tos -m rafael@ecopower.com.br")
print(stdout.read().decode())
if stderr:
    print("⚠️", stderr.read().decode()[:500])

# Testar HTTPS
print("\n✅ Testando HTTPS...")
stdin, stdout, stderr = ssh.exec_command("curl -I https://apipgsoft.shop 2>&1 | head -8")
print(stdout.read().decode())

print("\n" + "="*60)
print("🌐 https://apipgsoft.shop")
print("="*60)

ssh.close()
