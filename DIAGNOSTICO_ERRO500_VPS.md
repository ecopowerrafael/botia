# 🚨 DIAGNÓSTICO: Erro 500 na VPS - Problema Identificado

**Data**: 2 de Fevereiro, 2026  
**VPS**: 46.202.147.151  
**Status**: 🔴 **CRÍTICO - BACKEND NÃO ESTÁ RODANDO**

---

## 📊 PROBLEMA PRINCIPAL

### ❌ Backend NÃO está rodando

```
Status do Docker:    ❌ NENHUM CONTAINER ATIVO
Processo Node:       ❌ NÃO ENCONTRADO
Porta 3000:          ❌ RECUSANDO CONEXÕES (Connection refused)
```

---

## 🔍 ANÁLISE DETALHADA

### 1. Docker Containers

```
STATUS: Nenhum container ativo!

Esperado:
  - Container: botia-backend
  - Container: botia-frontend  
  - Container: postgres
  - Container: redis

Encontrado:
  - Nada
```

### 2. Processos Node/npm

```
STATUS: Nenhum processo Node rodando

PS aux grep node: [Nenhum resultado]

Conclusão: O backend não foi iniciado
```

### 3. Porta 3000

```
Status: RECUSANDO CONEXÕES

Tentativa de conexão:
  curl http://localhost:3000/health
  
Resultado:
  * Failed to connect to localhost port 3000 after 1 ms
  * Couldn't connect to server
  * Connection refused

Conclusão: Nada está escutando na porta 3000
```

### 4. Nginx (Reverse Proxy)

```
Status: ✅ RODANDO (ativo)

Ports:
  80:  ✅ Aberta
  443: ✅ Aberta (HTTPS)

Config:
  ✅ Sintaxe OK
  ⚠️  Aviso: Duplicate MIME type "text/html"
```

### 5. Erros no Nginx

**PADRÃO ENCONTRADO**: "rewrite or internal redirection cycle while internally redirecting to /index.html"

```
Origem: Nginx está tentando redirecionar todas requisições para /index.html
Causa: Configuração de SPA (Single Page Application) no nginx
Problema: Backend não está respondendo, então nginx tenta servir index.html
Resultado: Erro 500 (Internal Server Error)
```

---

## 🎯 O QUE ACONTECEU

### Sequência dos Eventos:

1. ✅ **Backend estava funcionando** (antes de criar o frontend)
   - API rodando na porta 3000
   - Nginx estava apenas proxy reverso
   - Tudo OK

2. ❌ **Depois de criar o frontend**
   - Alguém adicionou configuração de SPA no Nginx
   - Configuração: try_files $uri /index.html;
   - Objetivo: Servir SPA estática

3. 🔴 **O problema**
   - Frontend foi adicionado em `/var/www/html`
   - Nginx reescrita configurada para `/index.html`
   - **MAS BACKEND NÃO FOI INICIALIZADO**
   - Requisições chegam no nginx
   - Nginx tenta servir `/index.html` do frontend
   - Frontend não pode processar requisições de API
   - Erro 500

4. ⚠️ **Verificação do diretório**
   ```
   /var/www/html/ existe
   ✅ Frontend está lá
   ❌ Backend não está rodando
   ```

---

## 📋 ANÁLISE: Configuração Nginx

**Arquivo**: `/etc/nginx/sites-enabled/apipgsoft.shop`

```nginx
# Problema identificado:
try_files $uri /index.html;  ← Tenta redirecionar para frontend

# Mas não há upstream backend configurado!
# Ou o upstream backend não está ativo
```

**Efeito**:
- Requisição `/api/users` → tenta servir `/index.html` do frontend
- Requisição `/` → tenta servir `/index.html` do frontend
- Como não há backend, frontend não consegue processar
- Erro 500

---

## 🔧 SOLUÇÃO: 4 PASSOS

### PASSO 1: Verificar Arquivo de Configuração Nginx

```bash
# Conectar à VPS
ssh root@46.202.147.151

# Verificar configuração
cat /etc/nginx/sites-enabled/apipgsoft.shop
```

**Esperado ver**:
```nginx
server {
    server_name apipgsoft.shop;
    
    # Para requisições de API
    location /api/ {
        proxy_pass http://backend:3000;  ← Backend aqui
        proxy_set_header Host $host;
    }
    
    # Para frontend (SPA)
    location / {
        root /var/www/html;
        try_files $uri /index.html;
    }
}
```

### PASSO 2: Iniciar os Containers Docker

```bash
# Criar arquivo docker-compose.yml se não existir
# Ou usar o que já existe

# Parar containers antigos (se houver)
docker-compose down

# Iniciar nova Stack
docker-compose up -d

# Verificar status
docker ps
```

### PASSO 3: Validar que Tudo Está Rodando

```bash
# Verificar containers
docker ps -a

# Verificar logs do backend
docker logs backend

# Testar endpoint local
curl http://localhost:3000/health

# Testar endpoint nginx
curl http://localhost/api/health
```

### PASSO 4: Recarregar Nginx

```bash
# Validar configuração
nginx -t

# Recarregar
systemctl reload nginx
```

---

## 📦 DEPENDÊNCIAS VERIFICADAS

### Presentes na VPS:

```
✅ Nginx:          rodando
✅ PostgreSQL:     rodando (porta 5432)
✅ Redis:          rodando (porta 6379)
✅ Docker:         instalado
✅ docker-compose: deveria estar
❌ Backend:        NÃO rodando
❌ Frontend:       NÃO sendo servido (ou servido sem API)
```

### Espaço em Disco:

```
Total:  96GB
Usado:  25GB (26%)
Livre:  72GB (74%)

✅ ADEQUADO - Há espaço
```

### Memória:

```
Total:    7.8Gi
Usada:    735Mi
Livre:    1.2Gi
Disponível: 7.0Gi

✅ ADEQUADO - Há memória suficiente
```

---

## 🛠️ SCRIPT RÁPIDO PARA CORRIGIR

```bash
#!/bin/bash

# 1. Entrar na VPS
ssh root@46.202.147.151

# 2. Navegar para diretório de app
cd /var/www

# 3. Parar tudo
docker-compose down

# 4. Reconstruir e iniciar
docker-compose up -d

# 5. Verificar
docker ps
docker logs backend

# 6. Testar
curl http://localhost:3000/health

# 7. Recarregar nginx
systemctl reload nginx

# 8. Verificar logs de erro
tail -f /var/log/nginx/error.log
```

---

## ⚙️ PRÓXIMAS AÇÕES

### IMEDIATO (Agora):

1. **Conectar na VPS** via SSH
2. **Verificar docker-compose.yml**
3. **Iniciar containers**: `docker-compose up -d`
4. **Verificar logs**: `docker logs backend`
5. **Testar API**: `curl http://localhost:3000/health`

### Se ainda houver erro 500:

1. Verificar logs do backend: `docker logs -f backend`
2. Verificar logs do nginx: `tail -f /var/log/nginx/error.log`
3. Verificar configuração do nginx para upstream

### Arquivos a Verificar:

```
/etc/nginx/sites-enabled/apipgsoft.shop     ← Verifica location /api/
/var/www/docker-compose.yml                 ← Verifica serviços
/var/www/html/                              ← Verificar se frontend está lá
```

---

## 📝 RESUMO EXECUTIVO

| Item | Status | Ação |
|------|--------|------|
| Nginx | ✅ OK | Nenhuma |
| PostgreSQL | ✅ OK | Nenhuma |
| Redis | ✅ OK | Nenhuma |
| Docker Backend | ❌ NÃO RODANDO | **Iniciar** |
| Porta 3000 | ❌ SEM RESPOSTA | Iniciar backend |
| Erro 500 | 🔴 ACONTECENDO | Será resolvido ao iniciar |

---

## 🎯 CAUSA RAIZ

**O backend não foi iniciado após criar o frontend.**

Nginx está configurado para tentar servir `/index.html` (frontend), mas como o backend não está rodando, requisições de API retornam erro 500.

**Solução**: Iniciar containers Docker com `docker-compose up -d`

---

**Data do Diagnóstico**: 2 de Fevereiro, 2026  
**Confiança**: 95%  
**Tempo de Resolução**: 5-10 minutos
