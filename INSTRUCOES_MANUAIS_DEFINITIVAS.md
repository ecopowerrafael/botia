# 🔴 SITUAÇÃO HONESTA

## O Problema Real

A conexão SSH está muito instável. **Até eu (um script Python com acesso total) estou tendo timeouts**.

Isso significa:
- ❌ Scripts Python não são confiáveis (SSH timeout)
- ❌ Você também terá problemas se tentar via terminal SSH
- ✅ Mas **pequenos comandos funcionam**

## A Solução

Você precisa fazer **manualmente via SSH**, mas **um comando de cada vez** e **esperando terminar cada um**.

---

## PLANO DE AÇÃO (5 MINUTOS)

### 1. Conecte SSH
```bash
ssh root@46.202.147.151
# Password: 2705#Data2705
```

### 2. Navegue
```bash
cd /var/www/botia
```

### 3. Execute CADA COMANDO abaixo, UM POR UM:

#### Comando 1: Parar tudo
```bash
docker stop botia-backend botia-postgres botia-redis 2>/dev/null || true
```
**Aguarde 3 segundos**

#### Comando 2: Remover tudo
```bash
docker rm -f botia-backend botia-postgres botia-redis 2>/dev/null || true
```
**Aguarde 2 segundos**

#### Comando 3: Iniciar postgres
```bash
docker run -d --name botia-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=botia_db -p 5432:5432 -v postgres_data:/var/lib/postgresql/data postgres:15-alpine
```
**Aguarde 8 segundos** (deixe postgres inicializar)

#### Comando 4: Iniciar redis
```bash
docker run -d --name botia-redis -p 6379:6379 -v redis_data:/data redis:7-alpine
```
**Aguarde 3 segundos**

#### Comando 5: Iniciar backend
```bash
cd /var/www/botia && docker run -d --name botia-backend -p 3000:3000 -e NODE_ENV=production -e DATABASE_URL="postgresql://postgres:postgres@localhost:5432/botia_db" -e REDIS_URL="redis://localhost:6379" -w /app -v /var/www/botia:/app --network host node:22-alpine sh -c "npm ci --omit=dev && node apps/backend/dist/main"
```
**Aguarde 20 segundos** (deixa npm instalar)

### 4. Verifique
```bash
docker ps -a
```

Você deve ver 3 containers com "Up" (não "Created")

### 5. Teste
```bash
curl http://localhost:3000/health
```

Se vir um JSON com sucesso → **FUNCIONOU!** ✅

---

## SE BACKEND AINDA NÃO RESPONDER

```bash
docker logs botia-backend | tail -50
```

Compartilhe comigo o output disso.

---

##⚡ RESUMO

- 🔴 Scripts Python tem timeout de SSH (instabilidade de rede)
- 🟡 Você pode fazer manualmente, **um comando por vez**
- 🟢 Vai funcionar se aguardar corretamente entre comandos
- ✅ Total: ~5 minutos se não tiver erros

**Tente agora mesmo - apenas **não rode tudo de uma vez**, aguarde entre cada comando!**

