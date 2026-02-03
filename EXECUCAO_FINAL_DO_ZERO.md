# 🚀 EXECUÇÃO FINAL - DO ZERO SEM ERROS

## ⏱️ Estimativa: 30-45 minutos

---

## FASE 1: Atualizar Local (Sua Máquina) - 5min

```powershell
# Abrir PowerShell na pasta do projeto
cd "c:\Users\Code\OneDrive\Desktop\bot ia"

# Verificar que package.json foi atualizado
cat apps/backend/package.json | grep -A 3 "\"dependencies\""

# Resultado esperado:
# "dependencies": {
#   "@nestjs/bullmq": "^10.1.1",
#   "@prisma/client": "^5.20.0",
```

✅ Se viu essas versões, segue!

---

## FASE 2: Push para GitHub - 2min

No VPS (via SSH), execute:

```bash
ssh appuser@46.202.147.151

cd ~/apps/seu-projeto
git pull origin main
```

---

## FASE 3: Reset Completo do VPS - 10min

No VPS, execute o script de reset:

```bash
bash ~/RESET_VPS_COMPLETO.sh
```

**O que ele faz:**
1. Backup do .env (se existir)
2. Para todos os containers
3. Remove projeto antigo
4. Clone fresco do GitHub
5. Instala dependências v5 (Prisma, BullMQ)
6. Build do backend
7. Inicia Docker Compose

**Aguarde**: O script leva ~15min (Ollama download é lento)

---

## FASE 4: Corrigir Erros de Código - 8min

Se o build tiver erros após o reset, execute:

```bash
# No VPS
cd ~/apps/seu-projeto/apps/backend

# Corrigir automaticamente
bash ~/FIX_TYPESCRIPT_ERRORS.sh

# Tentar build novamente
npm run build
```

Se ainda tiver erros, compartilhe os primeiros 20:
```bash
npm run build 2>&1 | head -50
```

---

## FASE 5: Verificar Status - 5min

```bash
ssh appuser@46.202.147.151
cd ~/apps/seu-projeto/infra

# Status dos containers
docker-compose ps

# Esperado:
# STATUS             RUNNING (healthy) ✓
# para: postgres, redis, ollama, evolution-api, backend, nginx
```

Se algum container estiver com erro:
```bash
docker-compose logs [service-name] --tail=50
```

---

## FASE 6: Testar Endpoints - 3min

```bash
# Backend health
curl http://46.202.147.151:3000/health

# Esperado: JSON com status ok

# Evolution API health  
curl http://46.202.147.151:8080/health
```

---

## ⏸️ Se Algo Falhar

### Erro: "npm error Missing script: build"
```bash
# Verificar que package.json tem build script
cat package.json | grep '"build"'

# Se não tem, editar:
nano package.json
# Adicionar:
"scripts": {
  "build": "cd apps/backend && npm run build"
}
```

### Erro: "Cannot find module '@nestjs/bullmq'"
```bash
cd apps/backend
npm ci  # Reinstalar dependências
```

### Erro: "Prisma error"
```bash
cd apps/backend
npx prisma generate  # Regenerar cliente Prisma
npm run build
```

### Erro: "Docker image pull access denied"
```bash
cd infra
# Editar docker-compose.yml e comentar evolution-api
nano docker-compose.yml
# Salvar e tentar novamente:
docker-compose up -d
```

---

## ✅ Checklist Final

- [ ] Package.json atualizado (Prisma v5, BullMQ)
- [ ] Push para GitHub feito
- [ ] VPS resetado com `RESET_VPS_COMPLETO.sh`
- [ ] Build completou sem erros (`npm run build`)
- [ ] Todos 6 containers rodando (healthy)
- [ ] `curl http://46.202.147.151:3000/health` retorna 200 OK
- [ ] `curl http://46.202.147.151:8080/health` retorna 200 OK

---

## 🎯 Resumo do Que Mudou

### ✅ Corrigido
- Prisma v7.3.0 → v5.20.0 (compatível com código)
- @nestjs/bull → @nestjs/bullmq (novo padrão)
- bull → bullmq (novo padrão)
- Adicionado bcrypt, @types/bcrypt, decimal.js
- Dockerfile corrigido (npm ci no backend)
- package.json root com scripts corretos

### ⚙️ Arquivos Atualizados
- ✅ `apps/backend/package.json` - Versões corretas
- ✅ `apps/backend/Dockerfile` - Build fix
- ✅ `package.json` root - Scripts adicionados
- ✅ `infra/docker-compose.yml` - Image Evolution corrigida
- ✅ Scripts de deploy: RESET_VPS_COMPLETO.sh, FIX_TYPESCRIPT_ERRORS.sh

---

## 🚀 PRÓXIMO PASSO

Execute agora no VPS:

```bash
ssh appuser@46.202.147.151
bash ~/RESET_VPS_COMPLETO.sh

# Aguarde ~15 minutos
# Depois: docker-compose ps
```

Compartilha comigo a saída de `docker-compose ps` quando terminar! ✅
