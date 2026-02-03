# DEPLOY PRONTO - AGUARDANDO VPS

## Status Atual

✅ **Backend compilado com sucesso**
- 245 arquivos em `dist/`
- Zero erros TypeScript
- Dependências atualizadas (Prisma v5, BullMQ v11, etc)

❌ **VPS Status**
- IP: 172.104.71.250
- Porta 22 (SSH): ❌ Desligada/Inacessível
- Último ping: 2026-02-02 09:15 - 100% timeout

## Arquivos Prontos para Deploy

```
✅ apps/backend/dist/              (245 arquivos compilados)
✅ apps/backend/package.json       (dependências v5 compatível)
✅ prisma/schema.prisma            (com URL env var)
✅ DEPLOY_VPS_AUTO.ps1             (script automático pronto)
```

## O Que Fazer Quando VPS Voltar

### **Opção 1: Deploy Automático (RECOMENDADO)**
```bash
powershell -ExecutionPolicy Bypass -File DEPLOY_VPS_AUTO.ps1
```
⏱️ Tempo: ~5-10 minutos
✅ Faz tudo: backup, cópia, migrations, docker, health checks

### **Opção 2: Deploy Manual via SSH**
```bash
# 1. Copiar arquivos
scp -r apps/backend/dist root@172.104.71.250:/app/apps/backend/

# 2. Instalar dependências
ssh root@172.104.71.250 "cd /app/apps/backend && npm ci --omit=dev"

# 3. Rodar migrações
ssh root@172.104.71.250 "cd /app && npx prisma migrate deploy"

# 4. Reiniciar Docker
ssh root@172.104.71.250 "cd /app/infra && docker-compose restart backend"
```
⏱️ Tempo: ~10-15 minutos

### **Opção 3: Verificar Apenas Logs**
```bash
ssh root@172.104.71.250
docker-compose -f /app/infra/docker-compose.yml logs -f backend
```

## Checklist Pré-Deploy

- [ ] VPS respondendo no IP 172.104.71.250
- [ ] SSH port 22 acessível
- [ ] Docker Compose rodando em /app/infra
- [ ] PostgreSQL database criado
- [ ] Redis instância rodando
- [ ] .env configurado com DATABASE_URL
- [ ] Chave SSH em C:\Users\Code\.ssh\linode_vps (ou ajustar path)

## Problemas Conhecidos & Soluções

**VPS desligada?**
→ Ligar via Linode console (https://cloud.linode.com)

**Erro de chave SSH?**
```powershell
# Gerar chave se não existir
ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\linode_vps"

# Copiar para VPS
cat $env:USERPROFILE\.ssh\linode_vps.pub | ssh root@172.104.71.250 "cat >> ~/.ssh/authorized_keys"
```

**Porta 22 com timeout?**
→ Verificar firewall de entrada na Linode
→ Verificar se SSH está rodando: `systemctl status ssh`

**Docker-compose command not found?**
```bash
# Na VPS
apt update && apt install -y docker-compose
# ou use docker compose (v2)
docker compose up -d
```

## Próximos Passos

1. ✅ **Ligar a VPS** (console Linode)
2. ⏳ **Aguardar boot** (2-3 minutos)
3. 🚀 **Executar deploy automático** (5-10 min)
4. ✔️ **Validar health checks** (1 min)
5. 📝 **Documentar resultado** (5 min)

**Tempo total estimado: 15-20 minutos**

---

Avise quando VPS estiver online! 🚀
