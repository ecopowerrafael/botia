# SaaS Multi-Tenant WhatsApp CRM/ERP

## 🚀 Stack Tecnológico

### Backend & Core
- **Runtime**: Node.js + TypeScript (NestJS 11.0.1)
- **Banco de Dados**: PostgreSQL 16 + Prisma 7.3.0
- **Cache**: Redis 7 + Bull (job queue)
- **Scheduling**: @nestjs/schedule (cron jobs)

### Integrações
- **WhatsApp**: Evolution API (Docker container)
- **IA - Nuvem**: OpenAI (gpt-3.5-turbo) + Google Gemini
- **IA - Open Source**: Ollama (neural-chat, self-hosted VPS)
- **CMS Integration**: WordPress REST API (product/post/price sync)
- **Web Scraping**: Puppeteer + Cheerio
- **Data Import**: CSV parsing com multer

### Frontend
- Next.js + Tailwind CSS + ShadcnUI

## 📁 Estrutura de Pastas

```
apps/
  backend/                 # API principal (NestJS)
    src/
      modules/
        automation/        # Drip campaigns, mass messaging
        ia/                # Motor de IA (OpenAI/Gemini/Ollama)
        knowledge/         # Ingestor de conhecimento
        wordpress/         # Integração WordPress (NEW)
        whatsapp/          # Evolution API integration
        crm/               # CRM core
        kanban/            # Kanban de vendas
        tenant/            # Multi-tenancy, admin
        user/              # Usuários e permissões
      shared/              # Prisma service, middlewares
  frontend/                # UI (Next.js)
prisma/                    # ORM schema
infra/
  docker-compose.yml       # Orquestração de serviços
packages/                  # Libs compartilhadas
.github/                   # Copilot instructions
```

## 🔌 Módulos Funcionais

### Core
- ✅ **Multi-Tenancy**: Isolamento por tenant em BD
- ✅ **Autenticação**: Tenant validation, API keys
- ✅ **Gestão de Usuários**: Permissões e ACL

### Messaging & CRM
- ✅ **WhatsApp Integration**: Sincronizar contatos, enviar/receber mensagens
- ✅ **CRM**: Registro de leads, histórico de chat
- ✅ **Kanban**: Pipeline de vendas visual

### IA & Automação
- ✅ **Motor de IA Multi-Provider**:
  - OpenAI (gpt-3.5-turbo)
  - Google Gemini
  - Ollama (open source, VPS)
- ✅ **Drip Campaigns**: Envio automático de mensagens em sequência
- ✅ **Mass Messaging**: Broadcast para grupos/tags
- ✅ **Scheduling**: Agendamento com cron

### Conhecimento & Contexto
- ✅ **Knowledge Base**: Ingestor de web, planilhas, PDFs
- ✅ **Product Sync**: Integração com WordPress (produtos, posts, preços)
- ✅ **AI Context**: Produtos e conhecimento como contexto para respostas

## 🛠️ Serviços Docker

O `docker-compose.yml` orquestra:

```yaml
services:
  postgres          # Banco de dados principal
  redis             # Cache e job queue
  evolution-api     # WhatsApp messaging
  ollama            # IA open source (self-hosted)
  backend           # NestJS app
  frontend          # Next.js app
```

## 📊 Modelos de Dados (Prisma)

### Tenant
- Organização/conta
- Configurações globais
- Relações com todos os dados

### WordPressIntegration (NEW)
- URL do site WordPress
- Credenciais de API (Basic Auth)
- Configuração de quais campos sincronizar
- Frequência de sincronização

### WordPressProduct (NEW)
- Dados de produtos sincronizados do WordPress
- Disponível como contexto para IA

### IAProvider (UPDATED)
- Suporta: OPENAI, GEMINI, OLLAMA

## 🔄 Fluxo de Integração WordPress

```
1. Connectar site WordPress
2. Configurar quais campos sincronizar
3. Sincronizar produtos (manual ou automático)
4. Quando IA processa mensagens:
   - Busca produtos relevantes do DB
   - Inclui no contexto do sistema
   - IA referencia produtos nas respostas
```

## 📝 Endpoints Principais

### WordPress
```
POST   /wordpress/connect                      # Conectar novo site
POST   /wordpress/:id/configure                # Configurar campos a sincronizar
POST   /wordpress/:id/sync                     # Sincronizar dados manualmente
GET    /wordpress/integrations                 # Listar integrações
GET    /wordpress/:id                          # Detalhes da integração
DELETE /wordpress/:id                          # Desabilitar integração
```

### IA
```
POST   /ia/process-message                     # Processar mensagem com IA
       (suporta provider: openai, gemini, ollama)
```

### WhatsApp
```
POST   /whatsapp/send-message
POST   /whatsapp/send-media
GET    /whatsapp/contacts
POST   /whatsapp/sync-contacts
```

### Automação
```
POST   /automation/drip-campaign
POST   /automation/mass-message
GET    /automation/campaigns
POST   /automation/:id/start
POST   /automation/:id/stop
```

## 🚀 Como Iniciar

### 1. Ambiente Local

```bash
# Backend development
cd apps/backend
npm install
npm run start:dev

# Em outro terminal - Serviços auxiliares
docker compose -f infra/docker-compose.yml up
```

### 2. VPS com Ollama (Open Source)

```bash
# docker-compose.yml já inclui Ollama
docker compose -f infra/docker-compose.yml up -d

# Dentro do container Ollama, baixar modelo:
docker exec ollama ollama pull neural-chat

# Backend automaticamente detecta Ollama via OLLAMA_API_URL
```

### 3. Variáveis de Ambiente

```env
# Backend (apps/backend/.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/bot_ia
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
OLLAMA_API_URL=http://localhost:11434

# Evolution API
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=...
```

## 🔐 Segurança

- ✅ Multi-tenant isolation (database level)
- ✅ API key validation
- ✅ WordPress Basic Auth (encrypted credentials)
- ✅ TypeScript strict mode
- ✅ Input validation (class-validator)
- ✅ Rate limiting ready

## 📦 Tecnologias Principais

| Categoria | Tecnologia | Versão |
|-----------|-----------|--------|
| Runtime | Node.js | 18+ |
| Framework | NestJS | 11.0.1 |
| Language | TypeScript | 5.7.3 |
| ORM | Prisma | 7.3.0 |
| Database | PostgreSQL | 16 |
| Cache | Redis | 7 |
| AI Cloud | OpenAI | 6.17.0 |
| AI Cloud | Google Gemini | 0.24.1 |
| AI Self-Hosted | Ollama | latest |
| Messaging | Axios | 1.13.4 |
| Scraping | Puppeteer | 24.36.1 |
| Jobs | Bull | 4.16.5 |

## 📚 Documentação

- [WordPress Integration](./apps/backend/src/modules/wordpress/README.md)
- [IA Module](./apps/backend/src/modules/ia/README.md) *(in progress)*
- [Automation Module](./AUTOMATION_MODULE.md)
- [Backend Setup](./apps/backend/README.md)

## ✅ Status de Desenvolvimento

- ✅ Base architecture (NestJS, Prisma, Docker)
- ✅ Multi-tenancy system
- ✅ WhatsApp integration (Evolution API)
- ✅ IA module (OpenAI, Gemini)
- ✅ Knowledge base ingestion
- ✅ Drip campaigns + mass messaging
- ✅ **Ollama integration (open source IA)** [NEW]
- ✅ **WordPress integration** [NEW]
- ⏳ Frontend UI (in progress)
- ⏳ WordPress plugin (in progress)
- ⏳ Advanced scheduling (in progress)

## 🎯 Próximos Passos

1. [ ] Frontend dashboard
2. [ ] WordPress plugin desenvolvimento
3. [ ] Cron jobs para sync automático
4. [ ] Webhook support para WordPress
5. [ ] Multi-language AI support
6. [ ] Analytics dashboard
