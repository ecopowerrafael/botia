# 🎯 Comparativo Visual: 3 Estratégias de Carrinho

## 📊 Resumo Executivo

```
┌─────────────────────────────────────────────────────────────────┐
│                    ESTRATÉGIA 1: REDIS ONLY                      │
│                     (Recomendado para seu caso)                  │
├─────────────────────────────────────────────────────────────────┤
│ Velocidade:       ⚡⚡⚡⚡⚡ (200ms)                               │
│ Custo API:        💰 (2 WordPress + Redis)                       │
│ Persistência:     ⚠️ (24h TTL, se cair perde)                    │
│ Complexidade:     ✅ (Simples)                                   │
│ Escalabilidade:   ✅ (Muito boa)                                 │
│ Caso de uso:      Adega, restaurante, loja rápida               │
│ Melhor para:      Pedidos de curta duração                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   ESTRATÉGIA 2: BANCO DE DADOS                    │
│                    (Robusto, mais custoso)                        │
├─────────────────────────────────────────────────────────────────┤
│ Velocidade:       ⚡⚡⚡ (600ms)                                  │
│ Custo API:        💰💰 (BD + WordPress)                          │
│ Persistência:     ✅ (Sempre, histórico completo)                │
│ Complexidade:     ⚠️ (Moderada)                                  │
│ Escalabilidade:   ✅ (Boa com índices)                           │
│ Caso de uso:      E-commerce, grande volume                      │
│ Melhor para:      Pedidos que precisam de auditoria              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│               ESTRATÉGIA 3: CONTEXT WINDOW (IA)                   │
│                     (Lê conversa inteira)                         │
├─────────────────────────────────────────────────────────────────┤
│ Velocidade:       ⚡ (3s - aguarda IA)                           │
│ Custo API:        💰💰💰 (Tokens IA = caro)                     │
│ Persistência:     ❌ (Apenas histórico de chat)                  │
│ Complexidade:     ✅ (Simples, tudo em uma chamada)              │
│ Escalabilidade:   ❌ (Degrada com histórico longo)               │
│ Caso de uso:      Chatbot simples, demos                         │
│ Melhor para:      Conversas sem estrutura                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Exemplo Prático: Adega Vendendo 5 Produtos

### Mensagens do Cliente

```
1. "Qual o preço do Malbec?"
2. "Quero 2 garrafas"
3. "E o Cabernet Sauvignon?"
4. "Vou levar 1 garrafa"
5. "Quanto tá o espumante?"
6. "Quero 3"
7. "Pronto, confirma"
```

---

## Estratégia 1: REDIS (RECOMENDADA)

### Fluxo Detalhado

```
[1] "Qual o preço do Malbec?"
    ├─ Redis GET cart:chat-123 → ❌ Não existe
    ├─ WordPress search "Malbec" → R$ 80
    ├─ Redis SET cart:chat-123 { items: [], subtotal: 0 } (TTL 24h)
    └─ Response: "Malbec custa R$ 80/garrafa"

[2] "Quero 2 garrafas"
    ├─ Redis GET cart:chat-123 → ✅ Encontrou
    ├─ Detecta quantidade: 2
    ├─ Redis HSET malbec: { qty: 2, unit: 80, subtotal: 160 }
    ├─ Redis recalcula total: R$ 160
    └─ Response: "Adicionado! Total: R$ 160"

[3] "E o Cabernet Sauvignon?"
    ├─ Redis GET cart → ✅ Rápido
    ├─ WordPress search "Cabernet" → R$ 95
    └─ Response: "Cabernet custa R$ 95/garrafa"

[4] "Vou levar 1 garrafa"
    ├─ Redis GET cart → ✅
    ├─ Redis HSET cabernet: { qty: 1, unit: 95, subtotal: 95 }
    ├─ Redis recalcula: R$ 160 + R$ 95 = R$ 255
    └─ Response: "Total agora é R$ 255"

[5] "Quanto tá o espumante?"
    ├─ Redis GET cart → ✅
    ├─ WordPress search "Espumante" → R$ 120
    └─ Response: "Espumante custa R$ 120"

[6] "Quero 3"
    ├─ Redis GET cart → ✅
    ├─ Redis HSET espumante: { qty: 3, unit: 120, subtotal: 360 }
    ├─ Redis recalcula: R$ 255 + R$ 360 = R$ 615
    └─ Response: "Total: R$ 615"

[7] "Pronto, confirma"
    ├─ Redis GET cart:chat-123 → { malbec: 2x80, cabernet: 1x95, espumante: 3x120 }
    ├─ Criar Order no banco com esses itens
    ├─ Redis DEL cart:chat-123 (limpar)
    ├─ Enviar confirmação por email
    └─ Response: "Pedido #12345 confirmado! Total: R$ 615"
```

### Implementação

```typescript
// Redis Structure
key: "cart:chat-123"
value: {
  chatId: "chat-123",
  contactId: "contact-456",
  items: {
    malbec: { 
      name: "Malbec",
      wpProductId: "wp-1",
      quantity: 2,
      unitPrice: 80,
      subtotal: 160
    },
    cabernet: {
      name: "Cabernet Sauvignon",
      wpProductId: "wp-2",
      quantity: 1,
      unitPrice: 95,
      subtotal: 95
    },
    espumante: {
      name: "Espumante",
      wpProductId: "wp-3",
      quantity: 3,
      unitPrice: 120,
      subtotal: 360
    }
  },
  subtotal: 615,
  createdAt: "2026-02-01T10:00:00Z",
  expiresAt: "2026-02-02T10:00:00Z"
}

// Tempo de Resposta
[1] WP search: 150ms  → Total: 150ms
[2] Redis set: 10ms   → Total: 10ms
[3] WP search: 150ms  → Total: 150ms
[4] Redis update: 5ms → Total: 5ms
[5] WP search: 150ms  → Total: 150ms
[6] Redis update: 5ms → Total: 5ms
[7] Redis get + BD create: 50ms → Total: 50ms

Média: 75ms por mensagem ⚡⚡⚡⚡
Tempo total: 525ms para 7 mensagens
```

### Custo

```
APIs por conversa:
  - WordPress searches: 3 (Malbec, Cabernet, Espumante)
  - Redis operations: 6
  - Database writes: 1 (ao confirmar)
  
Total: 3 + 6 + 1 = 10 chamadas
Custo: ~$0.001 USD (praticamente nada)
```

---

## Estratégia 2: BANCO DE DADOS

### Fluxo Detalhado

```
[1] "Qual o preço do Malbec?"
    ├─ Query: SELECT * FROM Order WHERE chatId='chat-123' AND status='DRAFT'
    ├─ ❌ Não encontrou
    ├─ Query: INSERT INTO Order (chatId, status) VALUES
    ├─ WordPress search "Malbec" → R$ 80
    └─ Response: "Malbec custa R$ 80/garrafa"

[2] "Quero 2 garrafas"
    ├─ Query: SELECT * FROM Order WHERE chatId AND status='DRAFT'
    ├─ Query: INSERT INTO OrderItem (orderId, productName, quantity, unitPrice, subtotal)
    ├─ Query: UPDATE Order SET subtotal=160, total=160
    ├─ Query: SELECT items FROM Order... (para retorno)
    └─ Response: "Adicionado! Total: R$ 160"

[3] "E o Cabernet Sauvignon?"
    ├─ Query: SELECT * FROM Order... (verificar se existe)
    ├─ WordPress search "Cabernet" → R$ 95
    └─ Response: "Cabernet custa R$ 95"

[4] "Vou levar 1 garrafa"
    ├─ Query: SELECT * FROM Order...
    ├─ Query: INSERT INTO OrderItem
    ├─ Query: UPDATE Order SET subtotal=255, total=255
    └─ Response: "Total: R$ 255"

[5-7] ... (similar, mais 4 queries por mensagem)

Total de queries: ~3 por mensagem
```

### Implementação

```typescript
// Banco de Dados Structure
Table: Order
├─ id: uuid-1
├─ chatId: chat-123
├─ status: DRAFT
├─ subtotal: 615
├─ total: 615
└─ items: [OrderItem[], OrderItem[]]

Table: OrderItem
├─ id: uuid-item-1
├─ orderId: uuid-1
├─ productName: "Malbec"
├─ wpProductId: "wp-1"
├─ quantity: 2
├─ unitPrice: 80
└─ subtotal: 160

(repete para Cabernet e Espumante)

// Tempo de Resposta
[1] BD create: 200ms  → Total: 200ms
[2] BD insert + update: 250ms → Total: 250ms
[3] WP search: 150ms → Total: 150ms
[4] BD insert + update: 250ms → Total: 250ms
... (similar para outras)

Média: 200ms por mensagem ⚡⚡⚡
Tempo total: 1400ms para 7 mensagens
```

### Custo

```
Queries por conversa:
  - SELECT queries: 7 (verificar Order)
  - INSERT queries: 4 (OrderItem)
  - UPDATE queries: 3 (Order totals)
  - WordPress searches: 3
  
Total: 17 queries + 3 API calls
Custo: ~$0.05 USD (mais caro)
```

---

## Estratégia 3: CONTEXT WINDOW (IA)

### Fluxo Detalhado

```
[1] "Qual o preço do Malbec?"
    ├─ OpenAI API call com histórico vazio
    ├─ Prompt: "Cliente perguntou sobre Malbec. Responda o preço."
    ├─ Tokens: ~200
    ├─ Resposta IA: "Malbec custa R$ 80"
    └─ Response: "Malbec custa R$ 80/garrafa"

[2] "Quero 2 garrafas"
    ├─ OpenAI API call com histórico:
    │   - "Qual o preço do Malbec?"
    │   - "Malbec custa R$ 80/garrafa"
    │   - "Quero 2 garrafas"
    ├─ Prompt: "Cliente quer 2 garrafas de Malbec. Calcule o total."
    ├─ Tokens: ~350
    ├─ Resposta IA: "Seu total é R$ 160 (2 × R$ 80)"
    └─ Response: "Total: R$ 160"

[3-7] ... (cada mensagem cresce o histórico)
    ├─ [3] Tokens: ~400
    ├─ [4] Tokens: ~500
    ├─ [5] Tokens: ~600
    ├─ [6] Tokens: ~700
    └─ [7] Tokens: ~800

Total de tokens: 200 + 350 + 400 + 500 + 600 + 700 + 800 = 3550 tokens

// Tempo de Resposta
[1] OpenAI: 1.5s
[2] OpenAI: 1.8s (histórico maior)
[3] OpenAI: 1.8s
[4] OpenAI: 2.0s
[5] OpenAI: 2.2s
[6] OpenAI: 2.5s
[7] OpenAI: 2.8s

Média: 2.0s por mensagem 🐢
Tempo total: 14s para 7 mensagens
```

### Implementação

```typescript
// Context em cada chamada IA
systemPrompt = `Você é um vendedor de adega. 
Ajude o cliente a comprar vinho.
Mantenha um carrinho mental dos itens.

Histórico da conversa:
Cliente: "Qual o preço do Malbec?"
Bot: "Malbec custa R$ 80/garrafa"
Cliente: "Quero 2 garrafas"
Bot: "Seu total é R$ 160"
Cliente: "E o Cabernet Sauvignon?"
Bot: "Cabernet custa R$ 95/garrafa"
... (e assim vai crescendo)

Cliente agora diz: "${currentMessage}"`

// Tokens crescem exponencialmente
[1] 200 tokens
[2] 350 tokens
[3] 400 tokens
[4] 500 tokens
[5] 600 tokens
[6] 700 tokens
[7] 800 tokens
Total: 3550 tokens
```

### Custo

```
Modelo: GPT-3.5-turbo
Preço: $0.0005 / 1k tokens (input)
       $0.0015 / 1k tokens (output)

3550 tokens input × $0.0005 = $0.0017
~500 tokens output × $0.0015 = $0.0007

Custo total: ~$0.0025 USD
(Parece pouco, mas multiplicado por 1000 conversas = $2.50)
```

---

## 📊 Tabela Comparativa

| Critério | Redis | BD | IA Context |
|----------|-------|-----|-----------|
| **Velocidade** | 75ms | 200ms | 2000ms |
| **Chamadas API** | 10 | 17 | 7 (mas tokens altos) |
| **Custo** | ~$0.001 | ~$0.05 | ~$0.0025 |
| **Persistência** | ⚠️ 24h TTL | ✅ Sempre | ❌ Só chat |
| **Escalabilidade** | ✅ Até 10k carts | ✅ Até 1M orders | ❌ Degrada |
| **Complexidade** | ✅ Fácil | ⚠️ Média | ✅ Fácil |
| **Relatórios** | ❌ Não | ✅ Sim | ❌ Não |
| **Melhor para** | **Adega** | E-commerce | Demos |

---

## 🎓 Recomendação Final

### Para seu caso (Adega/Vendedor):

```
┌────────────────────────────────────────────────────┐
│  ESTRATÉGIA 1 (REDIS) + ESTRATÉGIA 2 (BD)          │
│           HÍBRIDA (O MELHOR DOS DOIS)              │
├────────────────────────────────────────────────────┤
│                                                    │
│  1. Carrinho RÁPIDO no Redis (durante conversa)   │
│  2. Salva no BD ao CONFIRMAR (persistência)        │
│  3. Se servidor cair, retoma do BD                │
│  4. Relatórios e histórico completo               │
│  5. Velocidade + Segurança                        │
│                                                    │
│  Tempo médio: 100ms (Redis)                        │
│  Custo: ~$0.002 USD por conversa                   │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Implementação:

```python
# Pseudo-código do fluxo ideal

def processar_mensagem(mensagem):
    cart = redis.get(f"cart:{chat_id}")  # 🚀 Rápido
    
    if not cart:
        cart = db.order.get(chat_id, status="DRAFT")  # Fallback
        
    if not cart:
        cart = db.order.create(chat_id)  # Criar novo
        
    intenção = detectar_intenção(mensagem)  # Regex, sem IA
    
    if intenção == "PREÇO":
        preço = wordpress.buscar_preço(produto)
        return responder_preço(preço)
    
    if intenção == "QUANTIDADE":
        item = {
            product: produto,
            quantity: quantidade,
            price: obter_preço_cache(produto)
        }
        
        cart.items.append(item)
        redis.set(f"cart:{chat_id}", cart, ex=86400)  # Redis
        db.order.update(cart)  # BD para backup
        
        return responder_total(cart.total)
    
    if intenção == "CONFIRMAR":
        db.order.update(cart, status="CONFIRMED")
        redis.delete(f"cart:{chat_id}")
        return responder_confirmação(cart)
    
    # Fallback para IA
    return ia.processar(mensagem, cart)
```

---

## ✅ Checklist para Implementação

```
FASE 1: Redis
  [ ] Instalar Redis (já tem no docker-compose)
  [ ] Criar CartRedisService
  [ ] Testes básicos

FASE 2: Banco de Dados
  [ ] Adicionar modelos (Order, OrderItem)
  [ ] Criar migrations
  [ ] Atualizar ORM

FASE 3: Detecção de Intenção
  [ ] Implementar detectIntent() com Regex
  [ ] Testar padrões comuns
  [ ] Melhorar com NLP se necessário

FASE 4: Integração
  [ ] Conectar ao IAService
  [ ] Remover chamadas IA desnecessárias
  [ ] Testes end-to-end

FASE 5: Testes e Deploy
  [ ] Testar conversa completa
  [ ] Verificar cálculos
  [ ] Deploy em staging
```

---

**Próximo passo:** Quer que eu comece implementando a Estratégia Híbrida (Redis + BD)?
