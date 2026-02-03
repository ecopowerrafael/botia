#!/usr/bin/env python3
"""
Verificar e corrigir schema.prisma
"""

import paramiko

HOST = '46.202.147.151'
USER = 'root'
PASSWORD = '2705#Data2705'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=20)

def cmd(c):
    stdin, stdout, stderr = ssh.exec_command(c, timeout=15)
    return stdout.read().decode()

print("VERIFICANDO SCHEMA")
print("=" * 70)

# Ver schema
schema = cmd("cat /var/www/botia/prisma/schema.prisma | head -30")
print("Schema atual:")
print(schema)

# Procurar por datasource
if 'datasource db {' in schema:
    if 'url = env(' in schema:
        print("\n✅ Schema parece OK")
    else:
        print("\n❌ Schema SEM url = env()")
        print("\nCorrigindo...")
        
        # Backup
        cmd("cp /var/www/botia/prisma/schema.prisma /var/www/botia/prisma/schema.prisma.bak")
        
        # Ler todo o schema
        full_schema = cmd("cat /var/www/botia/prisma/schema.prisma")
        
        # Procurar datasource e corrigir
        fixed = full_schema.replace(
            'datasource db {\n  provider = "postgresql"\n}',
            'datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}'
        )
        
        # Escrever
        cmd("""cat > /var/www/botia/prisma/schema.prisma << 'EOF'
""" + fixed + """
EOF""")
        
        print("✅ Schema corrigido!")
        
        # Regenerar prisma
        print("\nRegenerando Prisma...")
        cmd("cd /var/www/botia && npx prisma generate")
        print("✅ Prisma regenerado!")

ssh.close()
print("\n" + "=" * 70)
print("Verificação concluída!")
print("=" * 70)
