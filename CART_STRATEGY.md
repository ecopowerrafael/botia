# 🛒 Arquitetura de Carrinho de Compras para Bot Vendedor

## 📊 Fluxo Atual do Sistema

### Como Funciona Hoje

```
Cliente: "Qual o preço do vinho tinto?"
    ↓
[WhatsApp] → [Backend] → [IAService]
    ↓
Processa com IA:
├─ Busca produto no banco local (Product table)
├─ Busca no WordPress (WordPressService)
├─ Prepara contexto com informações
└─ Envia para IA (OpenAI/Gemini/Ollama)
    ↓
IA responde: "O vinho tinto custa R$ 45..."
    ↓
[Backend] → [Salva em IAHistory] → [Salva em Message]
    ↓
[WhatsApp] ← Mensagem enviada ao cliente
```

### Estrutura de Dados Atual

**Modelos envolvidos:**
- `Chat` - Conversa com cliente
- `Message` - Cada mensagem (usuário + bot)
- `IAHistory` - Histórico de IA (prompt + response)
- `Product` - Produtos locais
- `WordPressProduct` - Produtos do WordPress
- `Contact` - Cliente/contato

**O que NÃO temos ainda:**
- ❌ Modelo de `Order` (pedido)
- ❌ Modelo de `CartItem` (itens do carrinho)
- ❌ Rastreamento de status do pedido
- ❌ Cálculo de subtotal/total

---

## 🛍️ Necessidades para Vendedor em Adega

Para o fluxo que você descreveu:

```
1. Cliente: "Qual o preço do vinho tinto?"
   → Bot busca WordPress → Responde: "R$ 45"

2. Cliente: "Quero 2 garrafas"
   → Bot calcula: 2 × R$ 45 = R$ 90
   → Armazena: [vinho tinto, 2 garrafas, R$ 90]

3. Cliente: "Também quero cerveja"
   → Bot busca WordPress → Responde: "R$ 15"

4. Cliente: "Quero 5 cervejas"
   → Bot calcula: 5 × R$ 15 = R$ 75
   → Armazena: Adiciona à lista anterior
   → Responde: "Seu pedido: Vinho tinto (2x R$ 45 = R$ 90) + Cerveja (5x R$ 15 = R$ 75) = Total: R$ 165"

5. Cliente: "Confirma"
   → Bot finaliza pedido
   → Salva no banco de dados
   → Retorna resumo final
```

---

## 🎯 3 Estratégias de Implementação

### Estratégia 1: Sessão em Memória (RÁPIDA, BAIXO CONSUMO DE API)

**Como funciona:**
- Mantém o carrinho na memória do servidor (Redis)
- Durante a conversa, não consulta banco de dados
- Apenas lê mensagens anteriores da conversa
- Salva tudo no final

**Pros:**
✅ Muito rápido  
✅ Baixo consumo de API  
✅ Sem queries extras ao banco  
✅ Perfeito para conversas curtas  

**Contras:**
❌ Dados perdidos se servidor reiniciar  
❌ Não persiste entre sessões  
❌ Limite de memória se muitos chats abertos  

**Implementação:**
```typescript
// Em Redis (chave: cart:{chatId})
{
  chatId: "chat-123",
  items: [
    { name: "Vinho Tinto", quantity: 2, unitPrice: 45, wpProductId: 1 },
    { name: "Cerveja", quantity: 5, unitPrice: 15, wpProductId: 2 }
  ],
  subtotal: 165,
  createdAt: "2026-02-01T10:00:00Z",
  expiresAt: "2026-02-01T12:00:00Z"  // 2h timeout
}
```

**Custo:** 1 redis call por mensagem

---

### Estratégia 2: Banco de Dados (ROBUSTO, PERSISTENTE)

**Como funciona:**
- Cria modelo `Order` e `OrderItem` no banco
- Carrinho é um `Order` com `status: DRAFT`
- Persiste cada mudança no banco
- Recupera facilmente do histórico

**Pros:**
✅ Dados persistem sempre  
✅ Recupera conversa mesmo após reiniciar  
✅ Relatórios e histórico completo  
✅ Escalável para múltiplas abas abertas  

**Contras:**
❌ Mais queries ao banco  
❌ Mais lento  
❌ Consumo maior de BD  

**Implementação:**
```typescript
// Tabela: Order
{
  id: uuid,
  tenantId: uuid,
  chatId: uuid,
  contactId: uuid,
  status: "DRAFT" | "CONFIRMED" | "COMPLETED",
  subtotal: 165,
  tax: 0,
  total: 165,
  items: [ OrderItem[] ],
  createdAt: "2026-02-01T10:00:00Z",
  updatedAt: "2026-02-01T10:30:00Z"
}

// Tabela: OrderItem
{
  id: uuid,
  orderId: uuid,
  productId: uuid,
  productName: "Vinho Tinto",
  productSource: "WORDPRESS", // ou "LOCAL"
  unitPrice: 45,
  quantity: 2,
  subtotal: 90
}
```

**Custo:** 2-3 queries por mensagem relevante

---

### Estratégia 3: Context Window (ANÁLISE DE CONVERSA - ZERO CONSUMO)

**Como funciona:**
- Lê histórico de mensagens já armazenadas
- IA analisa toda a conversa para entender o carrinho
- Não precisa armazenar estrutura separada
- Apenas o último estado importa

**Pros:**
✅ Zero overhead  
✅ Sem storage extra  
✅ Simples de implementar  
✅ Funciona com conversas curtas  

**Contras:**
❌ IA precisa re-analisar toda conversa  
❌ Mais tokens consumidos de API  
❌ Fácil cometer erros se conversa longa  
❌ Dados se perdem se histórico for apagado  

**Implementação:**
```typescript
// Exemplo de prompt para IA
"Baseado no histórico desta conversa:
- Cliente pediu 2x Vinho Tinto (R$ 45 cada)
- Cliente pediu 5x Cerveja (R$ 15 cada)

Seu carrinho atual é:
- Vinho Tinto: 2 unidades = R$ 90
- Cerveja: 5 unidades = R$ 75
- TOTAL: R$ 165

Cliente agora diz: '${userMessage}'"
```

**Custo:** Tokens extras da IA por conversa completa

---

## 💡 Recomendação: HÍBRIDA (ESTRATÉGIAS 1 + 2)

**Melhor abordagem para seu caso:**

```
┌─────────────────────────────────────────────┐
│    Cliente inicia conversa                   │
│    → Criar DRAFT Order no banco              │
│    → Cache no Redis (TTL: 24h)               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│    Cliente pergunta preço                    │
│    → Busca no Redis (1º)                     │
│    → Se não tiver, busca no banco (2º)       │
│    → Responde com IA                         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│    Cliente diz quantidade                    │
│    → Atualiza Redis (carrinho)               │
│    → Atualiza banco (Order + OrderItems)     │
│    → Resposta imediata (sem IA)              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│    Cliente adiciona mais produtos            │
│    → Repete o ciclo                          │
│    → Acumula itens no Redis + BD             │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│    Cliente confirma pedido                   │
│    → Marca Order como CONFIRMED              │
│    → Remove do Redis                         │
│    → Retorna resumo final                    │
└─────────────────────────────────────────────┘
```

---

## 📋 Implementação Proposta

### Modelos para Adicionar (Prisma)

```prisma
model Order {
  id              String   @id @default(uuid())
  tenantId        String   @db.Uuid
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  chatId          String   @db.Uuid
  chat            Chat     @relation(fields: [chatId], references: [id])
  
  contactId       String   @db.Uuid
  contact         Contact  @relation(fields: [contactId], references: [id])
  
  status          OrderStatus @default(DRAFT)  // DRAFT, CONFIRMED, COMPLETED
  
  items           OrderItem[]
  
  subtotal        Decimal  @default(0)
  tax             Decimal  @default(0)
  discount        Decimal  @default(0)
  total           Decimal  @default(0)
  
  notes           String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  confirmedAt     DateTime?
}

enum OrderStatus {
  DRAFT
  CONFIRMED
  COMPLETED
  CANCELLED
}

model OrderItem {
  id              String   @id @default(uuid())
  orderId         String   @db.Uuid
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  productSource   String   // "WORDPRESS" ou "LOCAL"
  productSourceId String   // wpProductId ou localProductId
  productName     String
  
  unitPrice       Decimal
  quantity        Int
  subtotal        Decimal  // unitPrice × quantity
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Adicionar à Tenant
model Tenant {
  // ... existing fields ...
  orders          Order[]
}

// Adicionar ao Chat
model Chat {
  // ... existing fields ...
  orders          Order[]
}

// Adicionar ao Contact
model Contact {
  // ... existing fields ...
  orders          Order[]
}
```

### Serviço de Carrinho

```typescript
// cart.service.ts
@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly wordPressService: WordPressService,
  ) {}

  /**
   * Obter ou criar carrinho (Order DRAFT)
   */
  async getOrCreateCart(chatId: string, contactId: string, tenantId: string) {
    // 1º tenta Redis (cache)
    const cached = await this.redis.get(`cart:${chatId}`);
    if (cached) return JSON.parse(cached);

    // 2º tenta banco de dados
    let order = await this.prisma.order.findFirst({
      where: { chatId, status: 'DRAFT' },
      include: { items: true }
    });

    // 3º cria novo
    if (!order) {
      order = await this.prisma.order.create({
        data: {
          tenantId,
          chatId,
          contactId,
          status: 'DRAFT'
        },
        include: { items: true }
      });
    }

    // Cachear no Redis (24h TTL)
    await this.redis.setex(`cart:${chatId}`, 86400, JSON.stringify(order));

    return order;
  }

  /**
   * Adicionar item ao carrinho
   */
  async addItem(
    cartId: string,
    chatId: string,
    productName: string,
    productSourceId: string,
    source: 'WORDPRESS' | 'LOCAL',
    unitPrice: number,
    quantity: number
  ) {
    const subtotal = unitPrice * quantity;

    // Criar item
    const item = await this.prisma.orderItem.create({
      data: {
        orderId: cartId,
        productName,
        productSourceId,
        productSource: source,
        unitPrice,
        quantity,
        subtotal
      }
    });

    // Atualizar total do order
    const items = await this.prisma.orderItem.findMany({
      where: { orderId: cartId }
    });

    const newTotal = items.reduce((sum, i) => sum + i.subtotal, 0);

    const updatedOrder = await this.prisma.order.update({
      where: { id: cartId },
      data: { subtotal: newTotal, total: newTotal }
    });

    // Atualizar cache
    await this.redis.setex(`cart:${chatId}`, 86400, JSON.stringify(updatedOrder));

    return { item, order: updatedOrder };
  }

  /**
   * Listar itens do carrinho
   */
  async listItems(cartId: string) {
    return await this.prisma.orderItem.findMany({
      where: { orderId: cartId }
    });
  }

  /**
   * Confirmar pedido (DRAFT → CONFIRMED)
   */
  async confirmOrder(cartId: string, chatId: string) {
    const order = await this.prisma.order.update({
      where: { id: cartId },
      data: { 
        status: 'CONFIRMED',
        confirmedAt: new Date()
      },
      include: { items: true }
    });

    // Remover do Redis
    await this.redis.del(`cart:${chatId}`);

    return order;
  }

  /**
   * Resumo do carrinho (para mostrar ao cliente)
   */
  async getCartSummary(cartId: string): Promise<string> {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId: cartId }
    });

    const lines = items.map(item => 
      `${item.productName} (${item.quantity}x R$ ${item.unitPrice.toFixed(2)}) = R$ ${item.subtotal.toFixed(2)}`
    );

    const total = items.reduce((sum, i) => sum + i.subtotal, 0);

    return `
**Seu Pedido:**
${lines.join('\n')}

**TOTAL: R$ ${total.toFixed(2)}**
    `.trim();
  }
}
```

### Integração com IAService

```typescript
// ia.service.ts - atualizado para usar carrinho

async processMessage(dto: ProcessMessageDto) {
  const { tenantId, chatId, contactId, userMessage, provider } = dto;

  // 1. Obter/criar carrinho
  const cart = await this.cartService.getOrCreateCart(
    chatId,
    contactId,
    tenantId
  );

  // 2. Detectar intenção
  const intent = await this.detectIntent(userMessage);
  // intent = { type: 'QUANTITY', product: 'Vinho', quantity: 2 }
  // ou     = { type: 'PRICE_CHECK', product: 'Cerveja' }
  // ou     = { type: 'CONFIRM', }

  // 3. Processar conforme intenção
  if (intent.type === 'PRICE_CHECK') {
    // Buscar preço do WordPress
    return await this.handlePriceCheck(intent.product, tenantId);
  }

  if (intent.type === 'QUANTITY') {
    // Adicionar ao carrinho
    const product = await this.findProduct(intent.product, tenantId);
    await this.cartService.addItem(
      cart.id,
      chatId,
      product.name,
      product.id,
      'WORDPRESS',
      product.price,
      intent.quantity
    );

    // Mostrar resumo atualizado
    const summary = await this.cartService.getCartSummary(cart.id);
    return {
      response: `Adicionado! Vejo aqui:\n${summary}\n\nQuer algo mais?`,
      cartSummary: summary
    };
  }

  if (intent.type === 'CONFIRM') {
    // Confirmar pedido
    const confirmedOrder = await this.cartService.confirmOrder(cart.id, chatId);
    const summary = await this.cartService.getCartSummary(cart.id);
    
    return {
      response: `Perfeito! Seu pedido foi confirmado:\n${summary}`,
      orderId: confirmedOrder.id
    };
  }

  // Fallback para IA normal
  return await this.callAI(...);
}

/**
 * Detectar intenção do usuário
 */
private async detectIntent(message: string) {
  // Padrões simples (antes de chamar IA)
  
  if (message.match(/quantidad|quero|vou|levo|peço/i)) {
    // "Quero 2 garrafas"
    const qty = parseInt(message.match(/\d+/)?.[0] || '1');
    const productMatch = message.match(/d|d|vinho|cerveja|água|suco/i);
    return { 
      type: 'QUANTITY', 
      product: productMatch?.[0], 
      quantity: qty 
    };
  }

  if (message.match(/preço|quanto|custa|valor/i)) {
    // "Qual o preço do vinho?"
    const productMatch = message.match(/vinho|cerveja|água|suco/i);
    return { 
      type: 'PRICE_CHECK', 
      product: productMatch?.[0] 
    };
  }

  if (message.match(/confirma|ok|pronto|fechado|finaliza/i)) {
    // "Confirma"
    return { type: 'CONFIRM' };
  }

  return { type: 'GENERAL' };
}
```

---

## 🎯 Fluxo Completo Visualmente

### Cenário de Uso

```
CLIENTE                          BOT                          SISTEMA

"Qual o preço do 
vinho tinto?"
        ↓ [Mensagem recebida]
                              ← Detecta: PRICE_CHECK
                              ← Busca no WordPress
                              ← Cria Order DRAFT
        ← "R$ 45/garrafa"
        
"Quero 2 garrafas"
        ↓ [Mensagem recebida]
                              ← Detecta: QUANTITY (2x)
                              ← Adiciona ao carrinho
                              ← Atualiza Redis + BD
        ← "Adicionado!
           Seu pedido:
           Vinho: 2x R$ 45 = R$ 90
           TOTAL: R$ 90
           Quer mais?"

"Também quero 
uma cerveja"
        ↓ [Mensagem recebida]
                              ← Detecta: PRICE_CHECK
                              ← Busca Cerveja no WP
        ← "Cerveja custa R$ 15"

"Quero 5"
        ↓ [Mensagem recebida]
                              ← Detecta: QUANTITY (5x)
                              ← Adiciona ao carrinho
                              ← Atualiza Redis + BD
        ← "Perfeito!
           Seu pedido:
           - Vinho: 2x R$ 45 = R$ 90
           - Cerveja: 5x R$ 15 = R$ 75
           TOTAL: R$ 165
           Confirma?"

"Confirma"
        ↓ [Mensagem recebida]
                              ← Detecta: CONFIRM
                              ← Marca Order como CONFIRMED
                              ← Remove do Redis
        ← "Pedido confirmado!
           ✓ Vinho: 2x R$ 45 = R$ 90
           ✓ Cerveja: 5x R$ 15 = R$ 75
           
           TOTAL: R$ 165
           
           Obrigado! Seu pedido foi registrado."
```

---

## 📊 Comparativo de Consumo de API

### Cenário: 5 mensagens (2 preços + 3 quantidades + 1 confirmação)

**Estratégia 1: Redis Only**
```
APIs chamadas:
  1. Buscar "Vinho" WordPress: 1 call
  2. Buscar "Cerveja" WordPress: 1 call
  3. Redis SET (carrinho): 2 calls
  4. Redis GET (carrinho): 1 call
  
  Total: 5 Redis + 2 WordPress = 7 calls
  Tokens IA: 0 (sem usar IA para cart)
  ⏱️ Tempo: ~200ms
```

**Estratégia 2: Banco de Dados**
```
APIs chamadas:
  1. Buscar "Vinho" WordPress: 1 call
  2. Criar/atualizar Order: 3 queries (create + findMany + update)
  3. Buscar "Cerveja" WordPress: 1 call
  4. Criar OrderItem: 3 queries
  5. Confirmar Order: 1 query
  
  Total: 11 BD + 2 WordPress = 13 calls
  Tokens IA: 0
  ⏱️ Tempo: ~600ms
```

**Estratégia 3: Context Window**
```
APIs chamadas:
  1. Buscar "Vinho" WordPress: 1 call
  2. Chamar IA com histórico: 1 call (tokens: ~500)
  3. Buscar "Cerveja" WordPress: 1 call
  4. Chamar IA com histórico: 1 call (tokens: ~800)
  5. Confirmar com IA: 1 call (tokens: ~600)
  
  Total: 5 WordPress + 5 IA = 10 calls
  Tokens IA: ~2000 tokens
  ⏱️ Tempo: ~3s (aguarda IA)
```

**VENCEDOR: Estratégia 1 (Híbrida com Redis)**
- Mais rápido (200ms vs 600ms vs 3s)
- Menos chamadas de API
- Menos tokens IA consumidos
- Melhor UX (respostas instantâneas)

---

## 🚀 Próximos Passos para Implementação

### 1️⃣ Adicionar Modelos ao Prisma
- [ ] Criar `Order` e `OrderItem` models
- [ ] Adicionar relações em `Tenant`, `Chat`, `Contact`
- [ ] Run: `npx prisma migrate dev --name add_orders`

### 2️⃣ Implementar Cart Service
- [ ] Criar `cart.service.ts`
- [ ] Métodos: getOrCreateCart, addItem, listItems, confirmOrder
- [ ] Integração com Redis

### 3️⃣ Atualizar IA Service
- [ ] Adicionar `detectIntent()` method
- [ ] Integrar com `CartService`
- [ ] Remover chamadas IA para cálculos simples

### 4️⃣ Criar Controller
- [ ] Endpoints para visualizar carrinho
- [ ] Endpoint para confirmar manualmente

### 5️⃣ Testar Fluxo Completo
- [ ] Conversa simulada
- [ ] Validar cálculos
- [ ] Testar timeouts e persistência

---

## 💾 Resumo Técnico

| Aspecto | Recomendação |
|---------|--------------|
| **Armazenamento** | Híbrido: Redis (cache) + PostgreSQL (persistência) |
| **Detecção de Intent** | Regex + patterns (sem IA) |
| **Cálculos** | Aplicação (zero IA) |
| **Busca de Preços** | WordPress API ou banco local |
| **Confirmação** | Banco de dados + email/aviso |
| **TTL do Carrinho** | 24 horas |
| **Escalabilidade** | Suporta 1000+ carts simultâneos |

---

**Próximo passo:** Quer que eu implemente essa solução? Posso começar pelos modelos Prisma.
