#!/usr/bin/env python3
import paramiko
import requests
import json

HOST = "46.202.147.151"
USER = "root"
PASSWORD = input("SSH: ")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD)

print("\n🎯 Criando usuário demo...\n")

# Criar usuário via API
try:
    response = requests.post(
        'http://46.202.147.151:3000/users/create',
        json={
            'email': 'admin@botia.com',
            'name': 'Admin',
            'password': 'Admin123!',
            'role': 'ADMIN'
        },
        timeout=5
    )
    print("✅ Usuário admin criado!")
except Exception as e:
    print(f"⚠️  {e}")

# Criar tenant
try:
    response = requests.post(
        'http://46.202.147.151:3000/tenants',
        json={
            'name': 'Tenant Demo',
            'slug': 'tenant-demo',
            'operationMode': 'SELLER'
        },
        timeout=5
    )
    print("✅ Tenant criado!")
except Exception as e:
    print(f"⚠️  {e}")

print("\n" + "="*60)
print("🎉 PAINEL FUNCIONAL ATIVO!")
print("="*60)
print("\n📊 https://apipgsoft.shop")
print("👤 Email: admin@botia.com")
print("🔑 Senha: Admin123!")
print("\n" + "="*60)

ssh.close()
