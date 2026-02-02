# 🚀 Instalação VPS - Guia para Iniciante

## ⏰ Total: ~5 minutos de trabalho real

---

# PASSO 1: Conectar ao VPS

Abra seu terminal (PowerShell no Windows) e digite:

```
ssh root@46.202.147.151
```

Digite a senha quando aparecer: `2705#Data2705`

**✓ Pronto! Você está dentro do VPS**

---

# PASSO 2: Executar Script de Instalação

**Cole isso no terminal do VPS (tudo de uma vez):**

```bash
wget -O setup.sh https://seu-link-do-arquivo-setup.sh && chmod +x setup.sh && ./setup.sh
```

**OU se a URL não funcionar, copie todo o conteúdo do arquivo `SETUP_VPS_AUTOMATICO.sh` que criei e cole direto no terminal.**

O script vai:
- ✓ Atualizar o sistema
- ✓ Instalar Node.js
- ✓ Instalar Docker
- ✓ Instalar Docker Compose
- ✓ Configurar firewall
- ✓ Criar diretórios
- ✓ Criar usuário appuser
- ✓ Tudo automaticamente!

**Vai levar ~10-15 minutos. Deixe rodar.**

---

# PASSO 3: Clonar seu Projeto

Depois que terminar, digite no terminal do VPS:

```bash
su - appuser
cd ~/apps
git clone https://github.com/seu-usuario/seu-projeto.git
cd seu-projeto
```

**✓ Seu projeto agora está no VPS**

---

# PASSO 4: Configurar Arquivo .env

No terminal do VPS, digite:

```bash
cd infra
nano .env
```

Uma tela de edição vai abrir. **Altere apenas os valores em VERMELHO:**

```env
# ========== NODE ==========
NODE_ENV=production
LOG_LEVEL=info

# ========== DATABASE ==========
POSTGRES_USER=appuser
POSTGRES_PASSWORD=COLOQUE_UMA_SENHA_AQUI  ← MUDE ISSO
POSTGRES_DB=appdb_prod
POSTGRES_HOST=postgres

# ========== REDIS ==========
REDIS_HOST=redis
REDIS_PASSWORD=COLOQUE_UMA_SENHA_AQUI  ← MUDE ISSO

# ========== JWT ==========
JWT_SECRET=COLOQUE_UMA_STRING_ALEATORIRA_AQUI  ← MUDE ISSO

# ========== SEU DOMINIO ==========
CORS_ORIGIN=https://seu-dominio.com  ← COLOQUE SEU DOMINIO

# ========== EMAIL (opcional) ==========
SMTP_HOST=smtp.seu-provedor.com
SMTP_PORT=587
SMTP_USER=seu-email@seu-dominio.com
SMTP_PASSWORD=sua-senha
```

**Para salvar:**
1. Aperte `Ctrl + X`
2. Aperte `Y` (yes)
3. Aperte `Enter`

**✓ Arquivo .env salvo**

---

# PASSO 5: Iniciar os Serviços

No terminal do VPS, ainda na pasta infra, digite:

```bash
docker-compose up -d
```

Isso vai baixar e iniciar:
- ✓ PostgreSQL (banco de dados)
- ✓ Redis (cache)
- ✓ Ollama (IA)
- ✓ Backend (sua aplicação)
- ✓ Nginx (servidor web)
- ✓ Evolution API (WhatsApp)

**Vai levar 2-3 minutos na primeira vez.**

---

# PASSO 6: Verificar se Tudo Está Funcionando

Digite isso para ver o status:

```bash
docker-compose ps
```

Se aparecer assim = **PERFEITO** ✅

```
NAME                 STATUS
postgres             Up 2 minutes (healthy)
redis                Up 2 minutes (healthy)
backend              Up 1 minute (healthy)
nginx                Up 1 minute
ollama               Up 2 minutes
evolution-api        Up 1 minute
```

Se algum estiver "unhealthy", espere 30 segundos e digite novamente.

---

# PASSO 7: Testar API

Abra seu navegador (na sua máquina local, não no VPS) e acesse:

```
http://46.202.147.151/health
```

Se retornar algo com `"status":"ok"` = **FUNCIONANDO!** ✅

---

# PASSO 8: Configurar SSL/TLS (HTTPS)

Seu site ainda está em HTTP. Para HTTPS com certificado grátis:

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Gerar certificado (coloque seu domínio)
sudo certbot certonly --standalone \
  -d seu-dominio.com \
  -d www.seu-dominio.com \
  --email seu-email@seu-dominio.com \
  --agree-tos \
  --non-interactive

# Copiar certificado para o Docker
sudo cp -r /etc/letsencrypt/live/seu-dominio.com ~/certs/

# Copiar permissões
sudo chown -R appuser:appuser ~/certs/

# Recarregar Nginx
docker-compose restart nginx
```

**✓ HTTPS ativo**

---

# 🎉 PRONTO! Seu VPS está 100% funcional

## Resumo do que foi feito:

| O quê | Status |
|-------|--------|
| Sistema atualizado | ✅ |
| Node.js instalado | ✅ |
| Docker instalado | ✅ |
| Projeto clonado | ✅ |
| Banco de dados rodando | ✅ |
| IA (Ollama) funcionando | ✅ |
| API respondendo | ✅ |
| HTTPS certificado | ✅ |

---

# 📋 Comandos Úteis no VPS

## Ver logs em tempo real
```bash
docker-compose logs -f backend
```
(Aperte Ctrl+C para parar)

## Parar os serviços
```bash
docker-compose down
```

## Iniciar os serviços novamente
```bash
docker-compose up -d
```

## Ver uso de memória/CPU
```bash
docker stats
```

## Fazer backup do banco de dados
```bash
docker-compose exec postgres pg_dump -U appuser appdb_prod > backup-$(date +%Y%m%d-%H%M%S).sql
```

## Entrar no banco de dados
```bash
docker-compose exec postgres psql -U appuser -d appdb_prod
```

---

# ⚠️ IMPORTANTE: Senhas Seguras

As senhas que você colocou no .env são CRÍTICAS!

**Gere senhas fortes assim:**

## No Windows PowerShell:
```powershell
[System.Web.Security.Membership]::GeneratePassword(32, 5)
```

Copie o resultado e cole no .env.

## No Linux/macOS:
```bash
openssl rand -base64 32
```

---

# 🐛 Se Algo Deu Errado

## Problema: "docker command not found"
**Solução:** Saia e reconecte ao VPS
```bash
exit
ssh root@46.202.147.151
```

## Problema: "postgres unhealthy"
**Solução:** Aguarde 1 minuto e tente novamente
```bash
docker-compose logs postgres
```

## Problema: API não responde
**Solução:** Verificar logs
```bash
docker-compose logs -f backend
```

## Problema: Porta 80 ou 443 já em uso
**Solução:** Verificar o que está usando
```bash
sudo lsof -i :80
sudo lsof -i :443
```

---

# 📞 Precisa de ajuda?

Veja os arquivos:
- [ANALISE_CONSUMO_RECURSOS.md](./ANALISE_CONSUMO_RECURSOS.md) - Quantos recursos precisa
- [VPS_SETUP_GUIA_COMPLETO.md](./VPS_SETUP_GUIA_COMPLETO.md) - Explicações detalhadas
- [FASE11_DEPLOYMENT_GUIDE.md](./FASE11_DEPLOYMENT_GUIDE.md) - Documentação técnica

---

**Você consegue! É mais fácil do que parece.** 💪

Qualquer dúvida, era só chamar. Estou aqui pra ajudar! 🚀
