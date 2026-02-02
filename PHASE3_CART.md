# 🛒 FASE 3 IMPLEMENTADA: Shopping Cart

**Status:** ✅ BACKEND 100% PRONTO  
**Data:** 1º de Fevereiro, 2026  
**Tempo:** ~10 minutos

---

## ✅ O que foi criado

### **Cart Module** (4 arquivos)
```
✅ cart.dto.ts           - DTOs (AddItem, UpdateQty, ConfirmCart, CartResponse)
✅ cart.service.ts       - Lógica (cache em memória + persistência)
✅ cart.controller.ts    - Endpoints REST
✅ cart.module.ts        - Registro NestJS
```

---

## 🚀 APIs Implementadas

### **1. POST /cart/add-item** - Adicionar item ao carrinho

**Body:**
```json
{
  "chatId": "chat-123",
  "contactId": "contact-456",
  "tenantId": "tenant-789",
  "productName": "Vinho Tinto Reserva",
  "productSourceId": "wp-prod-123",
  "productSource": "WORDPRESS",
  "unitPrice": 89.90,
  "quantity": 2
}
```

**Resposta (200 OK):**
```json
{
  "chatId": "chat-123",
  "contactId": "contact-456",
  "tenantId": "tenant-789",
  "items": [
    {
      "productSourceId": "wp-prod-123",
      "productName": "Vinho Tinto Reserva",
      "productSource": "WORDPRESS",
      "unitPrice": 89.90,
      "quantity": 2,
      "subtotal": 179.80
    }
  ],
  "subtotal": 179.80,
  "tax": 14.38,
  "discount": 0,
  "total": 194.18,
  "itemCount": 2,
  "lastUpdated": "2026-02-01T19:20:00Z"
}
```

---

### **2. GET /cart/:tenantId/:chatId** - Obter carrinho

**URL:** `GET /cart/tenant-789/chat-123`

**Resposta (200 OK):**
```json
{
  "chatId": "chat-123",
  "contactId": "contact-456",
  "tenantId": "tenant-789",
  "items": [...],
  "subtotal": 179.80,
  "tax": 14.38,
  "discount": 0,
  "total": 194.18,
  "itemCount": 2,
  "lastUpdated": "2026-02-01T19:20:00Z"
}
```

---

### **3. POST /cart/update-qty** - Atualizar quantidade

**Body:**
```json
{
  "chatId": "chat-123",
  "productSourceId": "wp-prod-123",
  "quantity": 3
}
```

**Resposta:** Carrinho atualizado com nova quantidade

---

### **4. POST /cart/remove-item** - Remover item

**Body:**
```json
{
  "chatId": "chat-123",
  "productSourceId": "wp-prod-123"
}
```

**Resposta:** Carrinho sem o item removido

---

### **5. POST /cart/confirm** - Confirmar pedido

**Body:**
```json
{
  "chatId": "chat-123",
  "contactId": "contact-456",
  "tenantId": "tenant-789",
  "notes": "Entregar no horário comercial",
  "vendorMode": "SELLER"
}
```

**Resposta (201 CREATED):**
```json
{
  "success": true,
  "orderId": "order-uuid-123",
  "vendorOrderNumber": "#0201-4567",
  "cartCleared": true,
  "total": 194.18,
  "message": "Pedido criado: #0201-4567"
}
```

**O que acontece:**
1. ✅ Valida se carrinho não está vazio
2. ✅ Calcula subtotal, taxa (8%), total
3. ✅ Gera número do pedido (#MMDD-XXXX)
4. ✅ Cria Order no PostgreSQL
5. ✅ Cria OrderItems relacionados
6. ✅ Limpa carrinho
7. ✅ Retorna orderId para próximas etapas

---

### **6. DELETE /cart/:tenantId/:chatId** - Limpar carrinho

**URL:** `DELETE /cart/tenant-789/chat-123`

**Resposta (200 OK):**
```json
{
  "success": true,
  "message": "Carrinho limpo"
}
```

---

## 🏗️ Arquitetura

### **Cache Strategy**
```
Adicionar item
    ↓
Salva em memória (Map)  ← Rápido (<1ms)
    ↓
Cliente vê carrinho em tempo real
    ↓
Confirmar pedido
    ↓
Salva em PostgreSQL     ← Persistente
    ↓
Limpa memória
```

### **TODO: Migrar para Redis**
Atualmente usa `Map<string, any>` em memória. Para produção:
```typescript
// Em desenvolvimento
this.carts.set(cartKey, cart);

// Em produção (Redis)
await this.redis.setex(`cart:${cartKey}`, 86400, JSON.stringify(cart));
```

---

## 📊 Fluxo Completo do Carrinho

```
┌─────────────────────────────────────────┐
│ CLIENTE NAVEGA POR PRODUTOS            │
├─────────────────────────────────────────┤
│ WordPress API ou catálogo local        │
│ Mostra: nome, preço, foto             │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ CLIENTE: "Quero 2 vinhos"              │
├─────────────────────────────────────────┤
│ POST /cart/add-item                    │
│ {                                       │
│   chatId, productName, unitPrice: 89.90│
│   quantity: 2                           │
│ }                                       │
│                                         │
│ Sistema: Salva em memória              │
│ Resposta: Carrinho com 2 itens        │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ CLIENTE VÊ CARRINHO (via WhatsApp)     │
├─────────────────────────────────────────┤
│ GET /cart/tenant/chat                  │
│                                         │
│ Mostra:                                 │
│ - 2x Vinho Tinto Reserva R$ 89.90      │
│ - Subtotal: R$ 179.80                  │
│ - Taxa (8%): R$ 14.38                  │
│ - TOTAL: R$ 194.18                     │
│                                         │
│ Opções: [Continuar] [Remover] [Editar]│
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ CLIENTE: "Compra!"                     │
├─────────────────────────────────────────┤
│ POST /cart/confirm                     │
│                                         │
│ Sistema:                                │
│ 1. Valida carrinho                     │
│ 2. Calcula totais                      │
│ 3. Gera #0201-4567                     │
│ 4. Cria Order no banco                 │
│ 5. Cria OrderItems                     │
│ 6. Limpa carrinho da memória           │
│                                         │
│ Resposta:                               │
│ {                                       │
│   "success": true,                      │
│   "orderId": "order-uuid",              │
│   "vendorOrderNumber": "#0201-4567",   │
│   "total": 194.18                       │
│ }                                       │
└─────────────────────────────────────────┘
           ↓
        ✅ PRÓXIMA FASE
    (Payment & Comprovante)
```

---

## 💾 Persistência

### **Ordem criada no PostgreSQL**

```sql
-- Tabela Order criada em FASE 1
INSERT INTO "Order" (
  id, tenantId, chatId, contactId,
  status, paymentStatus,
  subtotal, tax, discount, total,
  vendorOrderNumber,
  createdAt, updatedAt
) VALUES (
  'order-uuid-123', 'tenant-789', 'chat-123', 'contact-456',
  'DRAFT', 'PENDING',
  179.80, 14.38, 0, 194.18,
  '#0201-4567',
  NOW(), NOW()
);

-- Itens do pedido
INSERT INTO "OrderItem" (id, orderId, productName, productSourceId, 
                         productSource, unitPrice, quantity, subtotal)
VALUES ('item-1', 'order-uuid-123', 'Vinho Tinto Reserva', 'wp-prod-123',
        'WORDPRESS', 89.90, 2, 179.80);
```

### **Status do Pedido**
```
OrderStatus:  DRAFT → CONFIRMED → PENDING_PAYMENT → PAID → ...
PaymentStatus: PENDING → PROCESSING → PAID → FAILED → REFUNDED
```

---

## 🔄 Integração com Outras Fases

### ✅ Dependências
- FASE 1: Database ✅ (Order, OrderItem tabelas)
- FASE 2: User Setup ✅ (Saber quem é o usuário)

### ⏳ Será consumido por
- FASE 4: Payment (recebe Order, valida pagamento)
- FASE 8: Vendor Notification (notifica vendedor)

---

## 📋 Código-Chave

### **CartService.confirmCart()**
```typescript
async confirmCart(dto: ConfirmCartDto): Promise<ConfirmResponseDto> {
  // 1. Validar carrinho não vazio
  if (!cart || cart.items.length === 0)
    throw new BadRequestException('Carrinho vazio');

  // 2. Calcular valores
  const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax - discount;

  // 3. Gerar número
  const vendorOrderNumber = `#${dateStr}-${randomNum}`;

  // 4. Salvar no banco
  const order = await this.prisma.order.create({
    data: {
      tenantId: dto.tenantId,
      chatId: dto.chatId,
      contactId: dto.contactId,
      status: OrderStatus.DRAFT,
      paymentStatus: PaymentStatus.PENDING,
      subtotal, tax, discount, total,
      vendorOrderNumber,
      items: {
        createMany: {
          data: cart.items.map(item => ({
            productName: item.productName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
          })),
        },
      },
    },
  });

  // 5. Limpar carrinho
  this.carts.delete(cartKey);

  return { success: true, orderId: order.id, ... };
}
```

---

## 🚀 Próximo: FASE 4 (Payment & Validation)

**O que será feito:**
1. **PaymentService** - Receber comprovante (PIX, boleto, screenshot)
2. **Ollama Integration** - LLaVA extrai dados da imagem
3. **PaymentProof** - Salvar prova de pagamento
4. **Vendor Notification** - WhatsApp ao vendedor

**Estimado:** 5 horas

---

## ✨ Status

```
✅ FASE 1: Database         [████████████████████] 100%
✅ FASE 2: User Setup       [████████████████████] 100%
✅ FASE 3: Shopping Cart    [████████████████████] 100%
⏳ FASE 4: Payment & Ollama [░░░░░░░░░░░░░░░░░░░░]   0%
⏳ FASE 5+: Resto           [░░░░░░░░░░░░░░░░░░░░]   0%

TOTAL: 27% Completo (3/11 fases)
```

---

**Próximo:** Quer começar **FASE 4 (Payment & Ollama)** ou revisar o código de FASE 3? 💳

