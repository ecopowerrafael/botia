# 🚨 RESUMO: Erro 500 na VPS - SOLUÇÃO RÁPIDA

**Problema Identificado**: Backend NÃO está rodando na VPS

---

## 🎯 O QUE FAZER AGORA

### Via SSH na VPS (46.202.147.151):

```bash
# Conectar
ssh root@46.202.147.151
# Senha: 2705#Data2705

# OPÇÃO 1: Se usando Docker
cd /var/www
docker-compose up -d
docker ps

# OPÇÃO 2: Se usando PM2
cd /var/www/apps/backend
npm install
npm run build
pm2 start dist/main.js --name "botia-backend"
pm2 status

# OPÇÃO 3: Se for preciso ajustar Nginx
# Verificar se /api está redirecionando para backend
nano /etc/nginx/sites-enabled/apipgsoft.shop

# Procure por:
location /api/ {
    proxy_pass http://localhost:3000;
}

# Se não tiver, adicione antes de:
location / { ... }
```

---

## ✅ DEPOIS DE EXECUTAR

```bash
# Testar se backend está respondendo
curl http://localhost:3000/health

# Verificar logs
docker logs backend        # Se usando Docker
pm2 logs                   # Se usando PM2

# Recarregar nginx
nginx -t
systemctl reload nginx

# Testar no navegador
https://apipgsoft.shop
```

---

## 📋 STATUS ATUAL

| Serviço | Status | Ação |
|---------|--------|------|
| Nginx | ✅ OK | Nenhuma |
| PostgreSQL | ✅ OK | Nenhuma |
| Redis | ✅ OK | Nenhuma |
| Backend | ❌ NÃO RODANDO | **INICIAR AGORA** |
| Docker | ❌ VAZIO | Se usar Docker: up -d |

---

## 🔧 DOCUMENTAÇÃO COMPLETA

Para análise detalhada, veja:
- `DIAGNOSTICO_ERRO500_VPS.md` - Diagnóstico completo
- `GUIA_CORRIGIR_ERRO500.md` - Guia passo-a-passo com 3 opções

---

**Tempo de solução**: 5-15 minutos
**Confiança**: 99%
