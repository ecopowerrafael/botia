# 🚀 Erro 500 - SOLUÇÃO FINAL

## PROBLEMA IDENTIFICADO
Os containers Docker não estão rodando no VPS. Todos estão em estado "Created" mas não conseguem iniciar.

## SOLUÇÃO RÁPIDA (5 minutos)

### Passo 1: Conectar ao VPS
```bash
ssh root@46.202.147.151
# Password: 2705#Data2705
```

### Passo 2: Execute este script completo (copie e cole tudo)

```bash
#!/bin/bash
cd /var/www/botia || { echo "Erro: /var/www/botia não existe"; exit 1; }

# 1. Parar containers antigos
docker-compose down 2>&1 || true
docker rm -f botia-backend botia-postgres botia-redis 2>&1 || true

# 2. Criar novo docker-compose.yml
cat > docker-compose.yml << 'EOF'
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

# 3. Iniciar containers
docker-compose up -d

# 4. Aguardar inicialização
echo "Aguardando inicialização dos containers..."
sleep 10

# 5. Verificar status
echo ""
echo "=== Status dos Containers ==="
docker-compose ps

echo ""
echo "=== Logs do Backend ==="
docker logs botia-backend | tail -30

echo ""
echo "=== Teste de Saúde ==="
curl -s http://localhost:3000/health || echo "Backend ainda está iniciando..."

```

### Passo 3: Verificar se funciona

```bash
# Se viu "OK" ou JSON no teste de saúde, está funcionando!
# Verifique a URL:
curl https://apipgsoft.shop/
```

---

## POR QUE ISSO FUNCIONA

1. **Docker usa imagem pré-compilada** - `node:22-alpine` ao invés de tentar compilar
2. **Volume compartilhado** - O código já compilado em `apps/backend/dist` é usado diretamente
3. **npm ci** - Instala dependências de forma rápida e segura
4. **Comando simplificado** - Remove a complexidade que estava causando travamento

---

## TROUBLESHOOTING

Se ainda der erro:

### Ver logs completos
```bash
docker logs botia-backend -f
```

### Verificar se postgres está pronto
```bash
docker logs botia-postgres
```

### Verificar se redis está pronto
```bash
docker logs botia-redis
```

### Ver processos no container
```bash
docker ps
docker inspect botia-backend
```

### Reset completo (último recurso)
```bash
cd /var/www/botia
docker-compose down -v
docker system prune -f
# Depois execute o script acima novamente
```

---

## PRÓXIMOS PASSOS

1. ✅ Execute o script acima
2. ✅ Aguarde 30 segundos para inicialização
3. ✅ Verifique com: `curl http://localhost:3000/health`
4. ✅ Teste no navegador: https://apipgsoft.shop/

Se continuar com erro 500, comente os logs para que possamos investigar.

