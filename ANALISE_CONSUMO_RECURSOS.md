# 📊 Análise de Consumo de Recursos - 10 Usuários + 100 Conversas Simultâneas

## 🎯 Cenário Analisado
- **Usuários WhatsApp:** 10 conexões ativas
- **Clientes por usuário:** 10 clientes simultâneos
- **Total de conversas:** 100 conversas simultâneas
- **IA Opensource:** Ollama com Mistral 7B (padrão do projeto)
- **Arquitetura:** Docker Compose (6 serviços)

---

## 📈 Consumo de Memória RAM por Componente

### 1️⃣ **NestJS Backend**
```
Base:                    150 MB
Por conexão WebSocket:   10-15 MB
100 conexões:            1.000-1.500 MB
Fila Bull (cache):       200-300 MB
───────────────────────────────
TOTAL Backend:           1.5-2.0 GB
```

**Justificativa:**
- Node.js v22 em produção usa ~150MB base
- Cada conexão WebSocket/HTTP mantém contexto em memória
- Bull queue armazena jobs pendentes
- Sessions/contexto de conversa

---

### 2️⃣ **PostgreSQL 16**
```
Base:                    250 MB
Shared Buffers (25%):    1.000-2.000 MB
Work Memory (100 conn):  500-800 MB
Cache Pages:             300-500 MB
────────────────────────────────
TOTAL PostgreSQL:        2.0-3.5 GB
```

**Justificativa:**
- shared_buffers = 25% de RAM total
- work_mem = memória por operação = 10-15MB × 100 conexões
- Índices + cache de queries
- Logs de transação

---

### 3️⃣ **Ollama (LLM Model)**
```
Modelo Mistral 7B:       4.5 GB (loaded em GPU/CPU)
Inference Cache:         1.0-2.0 GB (batch processing)
Context Windows:         500 MB-1.0 GB (100 contextos)
────────────────────────────────
TOTAL Ollama:            6.0-7.5 GB ⚠️ (MAIOR CONSUMIDOR)
```

**Justificativa:**
- Mistral 7B pré-carregado na memória
- Cada inferência cria contexto na memória
- 100 requisições simultâneas = 100 processamentos em fila
- Sem GPU dedicada = usa RAM + CPU

---

### 4️⃣ **Redis 7-Alpine**
```
Base:                    50 MB
Sessões (100 usuários):  50-100 MB
Cache de responses:      100-200 MB
Job metadata (Bull):     100-150 MB
────────────────────────────────
TOTAL Redis:             300-500 MB
```

**Justificativa:**
- Redis Alpine é leve
- Sessões + cache + job queue metadata
- TTL automático (expiração)

---

### 5️⃣ **Evolution API (WhatsApp)**
```
Base:                    300 MB
Por conexão WhatsApp:    10-20 MB
10 conexões:             100-200 MB
Message buffers:         100-200 MB
────────────────────────────────
TOTAL Evolution API:     500-700 MB
```

**Justificativa:**
- Evolution API é baseado em Node.js também
- Cada conexão mantém estado com WhatsApp
- Buffers de mensagens

---

### 6️⃣ **Nginx (Reverse Proxy)**
```
TOTAL Nginx:             50-100 MB
```

---

### 7️⃣ **Sistema Operacional + Docker Overhead**
```
Kernel + Docker:         800 MB - 1.2 GB
Buffer cache:            500 MB - 1.0 GB
────────────────────────────────
TOTAL SO:                1.3-2.2 GB
```

---

## 💰 **RESUMO TOTAL DE CONSUMO**

| Componente | Mínimo | Recomendado | Máximo |
|-----------|--------|-------------|--------|
| NestJS Backend | 1.5 GB | 2.0 GB | 2.5 GB |
| PostgreSQL | 2.0 GB | 2.5 GB | 3.5 GB |
| Ollama (LLM) | **6.0 GB** | **7.0 GB** | **8.0 GB** ⚠️ |
| Redis | 0.3 GB | 0.5 GB | 0.7 GB |
| Evolution API | 0.5 GB | 0.7 GB | 1.0 GB |
| Nginx | 0.05 GB | 0.1 GB | 0.2 GB |
| SO + Docker | 1.3 GB | 1.5 GB | 2.0 GB |
| **Buffer/Reserve** | - | **1.5 GB** | - |
| **───────────** | **───────** | **───────** | **───────** |
| **TOTAL** | **11.6 GB** | **15.8 GB** | **19.9 GB** |

---

## 🖥️ **RECOMENDAÇÕES DE VPS**

### ⭐ **OPÇÃO 1: Padrão (Recomendado)**
```
Processador:   4 vCPU (2.5-3.5 GHz)
Memória RAM:   16 GB
Storage:       100 GB SSD
Bandwidth:     Sem limite (5TB+/mês)
Estimado:      $20-30/mês
```

**Por que?**
- 16 GB RAM = 15.8 GB consumo + 0.2 GB margem
- 4 vCPU = adequado para Ollama + NestJS
- Sem gargalo

---

### 💪 **OPÇÃO 2: Robusta (Recomendado se crescimento)**
```
Processador:   8 vCPU (3.0-4.0 GHz)
Memória RAM:   32 GB
Storage:       200 GB SSD (ou NVME)
Bandwidth:     Sem limite (10TB+/mês)
Estimado:      $50-70/mês
```

**Por que?**
- 2x RAM = espaço para crescimento (20+ usuários)
- 8 vCPU = melhor performance em Ollama
- Headroom para variações de pico

---

### 🚀 **OPÇÃO 3: Performance (Para 50+ usuários)**
```
Processador:   16 vCPU + GPU (NVIDIA A100/L40)
Memória RAM:   64 GB
Storage:       500 GB NVMe
Bandwidth:     Sem limite (20TB+/mês)
Estimado:      $200-400/mês
```

**Por que?**
- GPU dedicada = 10x mais rápido que CPU em LLM
- 64 GB RAM = escalabilidade
- NVME = cache mais rápido para Ollama

---

## 🎯 **RECOMENDAÇÃO FINAL: OPÇÃO 1 (16 GB RAM)**

Para 10 usuários × 10 clientes = 100 conversas simultâneas

```
✅ ESCOLHA: 4 vCPU + 16 GB RAM + 100 GB SSD
🌍 Provedores sugeridos:
   • DigitalOcean: Droplet $24/mês
   • Linode: 16GB $80/mês (mais caro)
   • Hetzner: CX41 €27/mês (melhor custo/benefício)
   • AWS: EC2 t3.xlarge ~$200/mês (overkill)
   • Azure: Standard_D4s_v3 ~$150/mês (overkill)
```

---

## ⚙️ **OTIMIZAÇÕES RECOMENDADAS**

### 1️⃣ **Ollama - Reduzir Consumo**

**Opção A: Modelo mais leve**
```yaml
# Usar Mistral 7B (padrão: 7.2B parâmetros)
OLLAMA_MODEL=mistral  # Atual

# OU migrar para modelo menor
OLLAMA_MODEL=neural-chat  # 7B, mais rápido
# Economia: -1 GB RAM
```

**Opção B: Quantização**
```bash
# Forçar quantização Q4 (vs Q8 padrão)
# Reduz 8GB → 4GB com perda <2% qualidade
ollama run mistral:q4
# Economia: -4 GB RAM
```

---

### 2️⃣ **PostgreSQL - Otimizar Memória**

```sql
-- Reduzir shared_buffers se RAM limitada
-- /apps/backend/.env.production
POSTGRES_SHARED_BUFFERS=2GB      # 25% de 8GB
POSTGRES_WORK_MEM=10MB           # Por conexão
POSTGRES_MAX_CONNECTIONS=100

-- Resulta em: 3 GB → 1.5 GB
```

---

### 3️⃣ **Redis - Habilitar Eviction**

```bash
# .env.production
REDIS_MAXMEMORY=500MB
REDIS_MAXMEMORY_POLICY=allkeys-lru
# Auto-remove dados antigos
```

---

### 4️⃣ **NestJS - Limitar Conexões**

```typescript
// apps/backend/src/main.ts
const server = await app.listen(3000, () => {
  server.maxConnections = 100;  // Limita conexões simultâneas
  server.keepAliveTimeout = 60000;  // Desconecta inativo
});
```

---

## 📊 **CONSUMO COM OTIMIZAÇÕES**

Se aplicar todas as otimizações:

| Componente | Original | Otimizado | Economia |
|-----------|----------|-----------|----------|
| Ollama (Q4) | 7.0 GB | 3.0 GB | **-4 GB** |
| PostgreSQL | 2.5 GB | 1.5 GB | **-1 GB** |
| Redis | 0.5 GB | 0.3 GB | **-0.2 GB** |
| **TOTAL** | **15.8 GB** | **9.3 GB** | **-6.5 GB** |

**Resultado:** VPS 8 GB RAM + 2 vCPU seria suficiente (~$10-15/mês) ✅

---

## 🚨 **MONITORAMENTO EM PRODUÇÃO**

### Alertas importantes:

```bash
# Verificar consumo em tempo real
docker stats

# Alertar se:
# - RAM > 80% (8GB de 10GB)
# - CPU > 85% por 5+ minutos
# - Ollama latência > 3s

# Comando de monitoramento
watch -n 1 'docker stats --no-stream'
```

---

## 📋 **CHECKLIST PRÉ-PRODUÇÃO**

- [ ] Escolher VPS com 16 GB RAM (ou 8 GB com otimizações)
- [ ] Configurar alertas de memória
- [ ] Testar carga com 100 conexões simultâneas
- [ ] Habilitar compressão em Nginx
- [ ] Otimizar Ollama (Q4 quantization)
- [ ] Limpar cache Redis diariamente
- [ ] Backup PostgreSQL a cada 6 horas
- [ ] Monitorar logs de erro
- [ ] Implementar auto-scaling (se cloud)

---

## 🎓 **RESUMO EXECUTIVO**

| Pergunta | Resposta |
|----------|----------|
| **Consumo total?** | 15.8 GB RAM (pico: 19.9 GB) |
| **VPS recomendado?** | 4 vCPU + 16 GB RAM |
| **Custo?** | $20-30/mês (básico) |
| **Com otimizações?** | 8 GB RAM suficiente (~$10-15/mês) |
| **Gargalo principal?** | Ollama LLM (6-7 GB) |
| **CPU recomendada?** | 4 cores (4 vCPU) mínimo |
| **Quanto crescer para 50 usuários?** | 32 GB RAM + 8 vCPU recomendado |
| **Precisa GPU?** | Não obrigatória, mas 10x mais rápido |

---

## 🔗 **Documentação Relacionada**

- [FASE11_DEPLOYMENT_GUIDE.md](./FASE11_DEPLOYMENT_GUIDE.md) - Configuração de produção
- [infra/PRODUCTION_README.md](./infra/PRODUCTION_README.md) - Operações
- [docker-compose.yml](./infra/docker-compose.yml) - Configuração dos serviços
