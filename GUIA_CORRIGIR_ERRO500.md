# 🔧 GUIA COMPLETO: Corrigir Erro 500 na VPS

**Data**: 2 de Fevereiro, 2026  
**VPS**: 46.202.147.151  
**Problema**: Backend não está iniciado após criar frontend

---

## 📊 SITUAÇÃO ATUAL

### O que está rodando:
- ✅ Nginx (reverse proxy)
- ✅ PostgreSQL (localhost:5432)
- ✅ Redis (localhost:6379)
- ❌ Backend (NÃO rodando)
- ❌ Docker containers (nenhum ativo)

### O que não está:
- ❌ Docker containers
- ❌ Processo Node/npm do backend
- ❌ Porta 3000 não responde

### Resultado:
- 🔴 Erro 500 em todas as requisições HTTP

---

## 🎯 CAUSA RAIZ

Frontend está em `/var/www/html/` mas:
1. O Nginx foi configurado para servir SPA (Single Page App)
2. Mas o backend não foi iniciado
3. Nginx tenta redirecionar para `/index.html` (frontend)
4. Frontend não consegue processar requisições de API
5. Erro 500

---

## ✅ SOLUÇÃO: OPÇÃO A - Usar Docker

### Se você quer usar Docker (recomendado):

```bash
# 1. Conectar na VPS
ssh root@46.202.147.151
# Senha: 2705#Data2705

# 2. Navegar para /var/www
cd /var/www

# 3. Criar docker-compose.yml (veja template abaixo)
nano docker-compose.yml

# 4. Parar containers antigos (se houver)
docker-compose down

# 5. Construir imagens
docker-compose build

# 6. Iniciar containers
docker-compose up -d

# 7. Verificar status
docker ps

# 8. Verificar logs
docker logs -f backend

# 9. Testar
curl http://localhost:3000/health
curl http://localhost/api/health
```

### Template docker-compose.yml:

```yaml
version: '3.8'

services:
  backend:
    build: ./apps/backend
    container_name: botia-backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://user:password@postgres:5432/botia
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - app

  frontend:
    build: ./apps/frontend
    container_name: botia-frontend
    ports:
      - "3001:3000"
    networks:
      - app

  postgres:
    image: postgres:15
    container_name: botia-postgres
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: botia
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app

  redis:
    image: redis:7-alpine
    container_name: botia-redis
    networks:
      - app

networks:
  app:
    driver: bridge

volumes:
  postgres_data:
```

---

## ✅ SOLUÇÃO: OPÇÃO B - Iniciar Backend com PM2 (mais simples)

### Se o backend já estava rodando com PM2:

```bash
# 1. Conectar na VPS
ssh root@46.202.147.151
# Senha: 2705#Data2705

# 2. Navegar para backend
cd /var/www/apps/backend

# 3. Reinstalar dependências
npm install

# 4. Compilar
npm run build

# 5. Iniciar com PM2
pm2 start dist/main.js --name "botia-backend"

# 6. Verificar
pm2 status

# 7. Logs
pm2 logs botia-backend
```

---

## ✅ SOLUÇÃO: OPÇÃO C - Verificar Nginx

### Se o problema é apenas a configuração do Nginx:

```bash
# 1. Conectar
ssh root@46.202.147.151

# 2. Verificar config nginx
cat /etc/nginx/sites-enabled/apipgsoft.shop

# 3. Procuramos por algo assim:

# ❌ ERRADO (não diferencia API de frontend)
server {
    location / {
        root /var/www/html;
        try_files $uri /index.html;
    }
}

# ✅ CORRETO (diferencia API de frontend)
server {
    # API deve ir para backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
    
    # Frontend fica em /var/www/html
    location / {
        root /var/www/html;
        try_files $uri /index.html;
    }
}

# 4. Se for preciso corrigir, editar:
nano /etc/nginx/sites-enabled/apipgsoft.shop

# 5. Validar
nginx -t

# 6. Recarregar
systemctl reload nginx
```

---

## 🔍 PASSO A PASSO: Diagnóstico Completo

```bash
# 1. Conectar
ssh root@46.202.147.151

# 2. Verificar estrutura
ls -la /var/www/

# 3. Verificar se há código do projeto
ls -la /var/www/apps/ 2>/dev/null || echo "Nao encontrado"
ls -la /var/www/html/ 2>/dev/null || echo "Nao encontrado"

# 4. Verificar qual versão do node/npm
node --version
npm --version

# 5. Verificar PM2
pm2 status

# 6. Verificar processos node
ps aux | grep node

# 7. Verificar porta 3000
lsof -i :3000 || ss -tlnp | grep 3000

# 8. Verificar logs de nginx
tail -50 /var/log/nginx/error.log
tail -50 /var/log/nginx/access.log

# 9. Testar localhost
curl http://localhost:3000/health
curl http://localhost/api/health

# 10. Testar domínio
curl https://apipgsoft.shop/api/health
```

---

## 📋 CHECKLIST RÁPIDO

Responda sim/não para cada item:

- [ ] Backend rodando na porta 3000?
  - `curl http://localhost:3000/health`
  
- [ ] Docker containers rodando?
  - `docker ps`
  
- [ ] Nginx configurado corretamente?
  - `cat /etc/nginx/sites-enabled/apipgsoft.shop | grep proxy_pass`
  
- [ ] PostgreSQL acessível?
  - `psql -h localhost -U user botia -c "SELECT 1;"`
  
- [ ] Redis acessível?
  - `redis-cli ping`

Se responder "não" a algum, execute a solução correspondente.

---

## 🚨 SE NADA FUNCIONAR

### Últimos passos:

```bash
# 1. Verificar logs completos
docker logs backend 2>&1 | tail -100
pm2 logs 2>&1 | tail -100
cat /var/log/syslog | grep -i error | tail -20

# 2. Verificar se há disk space
df -h

# 3. Verificar memória
free -h

# 4. Reboot (último recurso)
sudo reboot

# 5. Depois, verificar
docker ps
pm2 status
```

---

## 📝 RESUMO EXECUTIVO

**Problema**: Backend não está rodando após criar frontend

**Causa**: Docker containers não foram iniciados/PM2 não foi configurado

**Solução**:
1. **OPÇÃO A (Docker)**: `docker-compose up -d`
2. **OPÇÃO B (PM2)**: `pm2 start dist/main.js`
3. **OPÇÃO C (Nginx)**: Configurar location /api/ → proxy para localhost:3000

**Tempo estimado**: 5-15 minutos

---

**Pronto?** Escolha a opção que melhor se encaixa e execute os comandos!
