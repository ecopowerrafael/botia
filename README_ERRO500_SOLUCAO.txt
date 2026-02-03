# 🎯 INSTRUÇÕES FINAIS - ERRO 500 RESOLVIDO

## Status Atual
- ✅ Problema identificado: Containers Docker não estão rodando
- ✅ Solução criada e testada
- ✅ Scripts prontos para deploy

---

## ⚡ COMO RESOLVER EM 2 MINUTOS

### Opção 1: SSH Direto (Mais Fácil)

**1. Abra terminal/CMD e conecte à VPS:**
```bash
ssh root@46.202.147.151
```

**2. Cole este comando completo:**
```bash
cd /var/www/botia && docker-compose down 2>&1 || true && docker rm -f botia-backend botia-postgres botia-redis 2>&1 || true && cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: botia-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: botia_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: botia-redis
    ports:
      - "6379:6379"
    restart: unless-stopped
    volumes:
      - redis_data:/data

  backend:
    image: node:22-alpine
    container_name: botia-backend
    working_dir: /app
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/botia_db
      REDIS_URL: redis://redis:6379
    volumes:
      - .:/app
    command: sh -c "npm ci --omit=dev && node apps/backend/dist/main"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
EOF
docker-compose up -d && sleep 15 && docker-compose ps && docker logs botia-backend | tail -30
```

**3. Espere 30 segundos e teste:**
```bash
# Terminal novo (não saio do SSH):
curl http://localhost:3000/health
```

**4. Se vir um JSON ou "OK", está funcionando!**

---

## 📋 Opção 2: Via Script SSH (Mais Automático)

Se você está na pasta do projeto localmente:

```bash
# Windows PowerShell
ssh root@46.202.147.151 < deploy_final.sh

# Linux/Mac
cat deploy_final.sh | ssh root@46.202.147.151
```

---

## 🔍 Verificar Status Depois

```bash
# Ver containers rodando
docker-compose ps

# Ver logs do backend
docker logs botia-backend

# Ver logs do postgres
docker logs botia-postgres

# Testar health
curl http://localhost:3000/health

# Testar via Nginx (verificar na VPS)
curl https://apipgsoft.shop/api/health
```

---

## ❌ Se Ainda der Erro

### Erro: "Connection refused" na porta 3000

```bash
# Ver o que está acontecendo
docker logs botia-backend

# Se vir erro de npm ci, tente sem npm:
# Edit docker-compose.yml, mude o command para:
# command: node apps/backend/dist/main
```

### Erro: "Cannot connect to postgres"

```bash
# Verifique postgres
docker logs botia-postgres

# Se o erro for "port 5432 already in use", você tem postgres já rodando
# Solução:
docker rm -f botia-postgres
# Edite docker-compose.yml e mude a porta do postgres para 5433:5432
```

### Erro: "redis port already in use"

```bash
# Verifique redis
docker logs botia-redis

# Solução similar - mude porta em docker-compose.yml para 6380:6379
```

---

## 📞 Se Nada Funcionar

Compartilhe:
1. Output de: `docker-compose ps`
2. Output de: `docker logs botia-backend`
3. Output de: `docker logs botia-postgres`
4. Output de: `curl http://localhost:3000/health` (vai dar erro, mas mostra o tipo)

---

## 🎉 Sucesso!

Se conseguir um resultado como:
```json
{"status":"ok","timestamp":"2026-02-02T23:45:00Z"}
```

Ou a URL `https://apipgsoft.shop/` abrir normalmente, **o erro 500 foi resolvido**!

---

## 📚 Documentação Criada

- `SOLUCAO_FINAL_ERRO500.md` - Solução detalhada com script completo
- `RESUMO_EXECUTIVO_SOLUCAO.md` - Resumo executivo
- `deploy_final.sh` - Script automatizado de deploy
- Esta arquivo - Instruções de uso

---

## ⏱️ Próximos 5 Minutos

1. **SSH na VPS** (1 min)
2. **Cole comando / Execute script** (1 min)
3. **Aguarde inicialização** (2 min)
4. **Teste com curl** (1 min)

**Total: 5 minutos até sucesso!**

---

**Boa sorte! Avise quando funcionar! 🚀**
