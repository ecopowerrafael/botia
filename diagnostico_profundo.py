#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Diagnóstico profundo - descobrir o real problema
"""
import paramiko
import os

if os.name == 'nt':
    os.system('chcp 65001 > nul')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('46.202.147.151', username='root', password='2705#Data2705', timeout=10)

def cmd(c):
    stdin, stdout, stderr = client.exec_command(c)
    return stdout.read().decode('utf-8', errors='ignore'), stderr.read().decode('utf-8', errors='ignore')

print("\n" + "="*70)
print("DIAGNOSTICO PROFUNDO - ERRO 500 CONTINUA")
print("="*70)

# 1. Docker containers
print("\n[1] CONTAINERS DOCKER - STATUS COMPLETO")
print("-" * 70)
out, _ = cmd('docker ps -a --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"')
print(out)

# 2. Se backend está criado mas não rodando
print("\n[2] LOGS DO CONTAINER BACKEND - ULTIMOS 100 LINHAS")
print("-" * 70)
out, _ = cmd('docker logs botia-backend 2>&1')
print(out[-3000:] if len(out) > 3000 else out)

# 3. Erros específicos
print("\n[3] PROCURANDO POR ERROS NO LOG")
print("-" * 70)
out, _ = cmd('docker logs botia-backend 2>&1 | grep -i "error\|fail\|exception" | tail -20')
print(out if out.strip() else "Nenhum erro explícito encontrado")

# 4. Se o backend iniciou
print("\n[4] VERIFICANDO SE BACKEND INICIOU")
print("-" * 70)
out, _ = cmd('docker logs botia-backend 2>&1 | grep -i "listening\|started\|running" | tail -5')
print(out if out.strip() else "Backend pode nao ter iniciado ainda")

# 5. Processos dentro do container
print("\n[5] PROCESSOS DENTRO DO CONTAINER BACKEND")
print("-" * 70)
out, _ = cmd('docker top botia-backend 2>&1 || echo "Container nao esta rodando"')
print(out)

# 6. Testar conectividade de rede
print("\n[6] TESTE DE REDE - CONECTIVIDADDE DOS CONTAINERS")
print("-" * 70)
out, _ = cmd('docker exec botia-backend ping -c 2 postgres 2>&1 || echo "Nao conseguiu ping postgres"')
print(out)

# 7. Testar porta 3000
print("\n[7] PORTA 3000 - QUEM ESTA ESCUTANDO")
print("-" * 70)
out, _ = cmd('netstat -tlnp 2>/dev/null | grep 3000 || ss -tlnp 2>/dev/null | grep 3000 || echo "Porta 3000 vazia"')
print(out)

# 8. Testar localhost:3000
print("\n[8] CURL PARA LOCALHOST:3000")
print("-" * 70)
out, _ = cmd('curl -v http://localhost:3000/health 2>&1 | head -50')
print(out)

# 9. Logs do nginx
print("\n[9] ERROS RECENTES DO NGINX")
print("-" * 70)
out, _ = cmd('tail -20 /var/log/nginx/error.log')
print(out)

# 10. Config do nginx
print("\n[10] CONFIGURACAO DO NGINX PARA API")
print("-" * 70)
out, _ = cmd('cat /etc/nginx/sites-enabled/apipgsoft.shop | grep -A10 "location /api"')
print(out)

# 11. Teste via nginx
print("\n[11] CURL PARA LOCALHOST/API/HEALTH")
print("-" * 70)
out, _ = cmd('curl -v http://localhost/api/health 2>&1 | head -50')
print(out)

# 12. Docker-compose status
print("\n[12] DOCKER-COMPOSE STATUS")
print("-" * 70)
out, _ = cmd('cd /var/www/botia && docker-compose ps')
print(out)

# 13. Docker stats
print("\n[13] RECUROS DOS CONTAINERS")
print("-" * 70)
out, _ = cmd('docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"')
print(out)

# 14. Espaço em disco
print("\n[14] ESPACO EM DISCO")
print("-" * 70)
out, _ = cmd('df -h | grep -E "^/dev|^Filesystem"')
print(out)

# 15. Verificar se a aplicação existe
print("\n[15] ARQUIVO MAIN.JS/MAIN.TS DO BACKEND")
print("-" * 70)
out, _ = cmd('ls -la /var/www/botia/apps/backend/dist/main.* 2>&1 || echo "Nao encontrado"')
print(out)

client.close()

print("\n" + "="*70)
print("DIAGNOSTICO CONCLUIDO")
print("="*70)
