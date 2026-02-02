# 🚀 Implementação Prática: Sistema de Carrinho

## 📋 Roadmap Detalhado

### FASE 1: Preparação (30 min)

#### 1.1 Adicionar Modelos Prisma

```prisma
// Adicionar ao schema.prisma

model Order {
  id              String   @id @default(uuid())
  tenantId        String   @db.Uuid
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  chatId          String   @db.Uuid
  chat            Chat     @relation(fields: [chatId], references: [id])
  
  contactId       String   @db.Uuid
  contact         Contact  @relation(fields: [contactId], references: [id])
  
  status          OrderStatus @default(DRAFT)
  items           OrderItem[]
  
  subtotal        Decimal  @default(0)
  tax             Decimal  @default(0)
  discount        Decimal  @default(0)
  total           Decimal  @default(0)
  
  notes           String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  confirmedAt     DateTime?
  
  @@index([tenantId, status])
  @@index([chatId])
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
  
  productSource   String   // "WORDPRESS" ou "LOCAL" ou "MANUAL"
  productSourceId String   // wpProductId, localProductId, ou null se manual
  productName     String
  
  unitPrice       Decimal
  quantity        Int
  subtotal        Decimal
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([orderId])
}

// Adicionar relações existentes

model Tenant {
  // ... existing fields ...
  orders          Order[]
}

model Chat {
  // ... existing fields ...
  orders          Order[]
}

model Contact {
  // ... existing fields ...
  orders          Order[]
}
```

#### 1.2 Executar Migração

```bash
cd apps/backend

# Criar migração
npx prisma migrate dev --name add_orders

# Gerar tipos TypeScript
npx prisma generate
```

---

### FASE 2: Serviço de Carrinho no Redis (45 min)

#### 2.1 Criar Redis Service

```typescript
// apps/backend/src/shared/redis.service.ts

import { Injectable, Logger } from '@nestjs/common';
import redis from 'redis';

@Injectable()
export class RedisService {
  private client: redis.RedisClient;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    this.client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis error:', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected');
    });
  }

  // Get value
  async get<T>(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, data) => {
        if (err) reject(err);
        else resolve(data ? JSON.parse(data) : null);
      });
    });
  }

  // Set value with expiration
  async setex(key: string, seconds: number, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.setex(key, seconds, JSON.stringify(value), (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Delete key
  async del(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Increment
  async incr(key: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.client.incr(key, (err, reply) => {
        if (err) reject(err);
        else resolve(reply);
      });
    });
  }
}
```

#### 2.2 Criar Cart Service

```typescript
// apps/backend/src/modules/cart/cart.service.ts

import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { RedisService } from '../../shared/redis.service';
import { WordPressService } from '../wordpress/wordpress.service';
import { CreateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  private readonly CART_TTL = 86400; // 24 horas

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly wordPressService: WordPressService,
  ) {}

  /**
   * Obter ou criar carrinho (Order DRAFT)
   */
  async getOrCreateCart(chatId: string, contactId: string, tenantId: string) {
    const cacheKey = `cart:${chatId}`;

    // 1. Tentar cache Redis
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cart found in Redis: ${chatId}`);
        return cached;
      }
    } catch (error) {
      this.logger.warn(`Redis error: ${error.message}`);
    }

    // 2. Tentar banco de dados
    let order = await this.prisma.order.findFirst({
      where: {
        chatId,
        status: 'DRAFT',
      },
      include: { items: true },
    });

    // 3. Criar novo se não existir
    if (!order) {
      order = await this.prisma.order.create({
        data: {
          tenantId,
          chatId,
          contactId,
          status: 'DRAFT',
        },
        include: { items: true },
      });
      this.logger.log(`Created new order: ${order.id}`);
    }

    // 4. Cache no Redis (24h)
    try {
      await this.redis.setex(cacheKey, this.CART_TTL, order);
    } catch (error) {
      this.logger.warn(`Failed to cache cart: ${error.message}`);
    }

    return order;
  }

  /**
   * Adicionar item ao carrinho
   */
  async addItem(
    chatId: string,
    dto: CreateCartItemDto,
  ) {
    const cacheKey = `cart:${chatId}`;

    // Buscar carrinho
    const order = await this.getOrCreateCart(
      dto.chatId,
      dto.contactId,
      dto.tenantId,
    );

    const subtotal = dto.unitPrice * dto.quantity;

    // Adicionar item ao banco
    const item = await this.prisma.orderItem.create({
      data: {
        orderId: order.id,
        productName: dto.productName,
        productSourceId: dto.productSourceId || null,
        productSource: dto.productSource,
        unitPrice: dto.unitPrice,
        quantity: dto.quantity,
        subtotal,
      },
    });

    // Recalcular total
    const items = await this.prisma.orderItem.findMany({
      where: { orderId: order.id },
    });

    const newTotal = items.reduce((sum, i) => sum + Number(i.subtotal), 0);

    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        subtotal: newTotal,
        total: newTotal,
      },
      include: { items: true },
    });

    // Atualizar cache
    try {
      await this.redis.setex(cacheKey, this.CART_TTL, updatedOrder);
    } catch (error) {
      this.logger.warn(`Failed to update cache: ${error.message}`);
    }

    return { item, order: updatedOrder };
  }

  /**
   * Buscar item no carrinho
   */
  async findItemByName(chatId: string, productName: string) {
    const order = await this.getOrCreateCart(chatId, '', '');
    
    return order.items.find(
      (item) =>
        item.productName.toLowerCase() === productName.toLowerCase(),
    );
  }

  /**
   * Atualizar quantidade de item
   */
  async updateItemQuantity(
    itemId: string,
    quantity: number,
    chatId: string,
  ) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true },
    });

    if (!item) {
      throw new HttpException('Item not found', HttpStatus.NOT_FOUND);
    }

    const newSubtotal = Number(item.unitPrice) * quantity;

    const updatedItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: {
        quantity,
        subtotal: newSubtotal,
      },
    });

    // Recalcular total
    const items = await this.prisma.orderItem.findMany({
      where: { orderId: item.orderId },
    });

    const newTotal = items.reduce((sum, i) => sum + Number(i.subtotal), 0);

    const updatedOrder = await this.prisma.order.update({
      where: { id: item.orderId },
      data: { subtotal: newTotal, total: newTotal },
      include: { items: true },
    });

    // Atualizar cache
    try {
      await this.redis.setex(`cart:${chatId}`, this.CART_TTL, updatedOrder);
    } catch (error) {
      this.logger.warn(`Failed to update cache`);
    }

    return updatedOrder;
  }

  /**
   * Remover item do carrinho
   */
  async removeItem(itemId: string, chatId: string) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true },
    });

    if (!item) {
      throw new HttpException('Item not found', HttpStatus.NOT_FOUND);
    }

    // Deletar item
    await this.prisma.orderItem.delete({
      where: { id: itemId },
    });

    // Recalcular total
    const items = await this.prisma.orderItem.findMany({
      where: { orderId: item.orderId },
    });

    const newTotal = items.reduce((sum, i) => sum + Number(i.subtotal), 0);

    const updatedOrder = await this.prisma.order.update({
      where: { id: item.orderId },
      data: { subtotal: newTotal, total: newTotal },
      include: { items: true },
    });

    // Atualizar cache
    try {
      await this.redis.setex(`cart:${chatId}`, this.CART_TTL, updatedOrder);
    } catch (error) {
      this.logger.warn(`Failed to update cache`);
    }

    return updatedOrder;
  }

  /**
   * Listar itens do carrinho
   */
  async listItems(chatId: string) {
    const order = await this.getOrCreateCart(chatId, '', '');
    return order.items;
  }

  /**
   * Resumo formatado do carrinho (para mostrar ao cliente)
   */
  async getCartSummary(chatId: string): Promise<string> {
    const order = await this.getOrCreateCart(chatId, '', '');

    if (order.items.length === 0) {
      return 'Seu carrinho está vazio';
    }

    const lines = order.items.map((item) => {
      const subtotal = Number(item.subtotal).toFixed(2);
      const unitPrice = Number(item.unitPrice).toFixed(2);
      return `• ${item.productName}: ${item.quantity}x R$ ${unitPrice} = R$ ${subtotal}`;
    });

    const total = Number(order.total).toFixed(2);

    return (
      `**Seu Pedido:**\n` +
      lines.join('\n') +
      `\n\n**TOTAL: R$ ${total}**`
    );
  }

  /**
   * Confirmar pedido (DRAFT → CONFIRMED)
   */
  async confirmOrder(chatId: string): Promise<string> {
    const order = await this.getOrCreateCart(chatId, '', '');

    if (order.items.length === 0) {
      throw new HttpException(
        'Carrinho vazio. Adicione itens antes de confirmar.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const confirmedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
      include: { items: true },
    });

    // Remover do cache
    try {
      await this.redis.del(`cart:${chatId}`);
    } catch (error) {
      this.logger.warn(`Failed to clear cache`);
    }

    return `Pedido #${confirmedOrder.id.substring(0, 8).toUpperCase()} confirmado! Total: R$ ${Number(confirmedOrder.total).toFixed(2)}`;
  }

  /**
   * Cancelar pedido
   */
  async cancelOrder(chatId: string) {
    const order = await this.getOrCreateCart(chatId, '', '');

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    });

    // Remover do cache
    try {
      await this.redis.del(`cart:${chatId}`);
    } catch (error) {
      this.logger.warn(`Failed to clear cache`);
    }

    return 'Pedido cancelado';
  }
}
```

---

### FASE 3: Detecção de Intenção (30 min)

#### 3.1 Criar Intent Detector

```typescript
// apps/backend/src/modules/ia/intent-detector.ts

export interface DetectedIntent {
  type: 'PRICE_CHECK' | 'ADD_TO_CART' | 'CONFIRM' | 'CANCEL' | 'VIEW_CART' | 'GENERAL';
  product?: string;
  quantity?: number;
  confidence: number;
}

export class IntentDetector {
  /**
   * Detectar intenção do usuário baseado em padrões
   */
  static detect(message: string): DetectedIntent {
    const msg = message.toLowerCase().trim();

    // [1] PRICE CHECK
    if (msg.match(/qual.*preço|quantc|custa|valor|how much/i)) {
      const productMatch = msg.match(
        /(?:do|da|de)\s+([a-záéíóú\s]+?)(?:\?|$)/i,
      );
      return {
        type: 'PRICE_CHECK',
        product: productMatch?.[1]?.trim(),
        confidence: 0.95,
      };
    }

    // [2] ADD TO CART (quantidade explícita)
    if (msg.match(/quero|vou|levo|peço|queria|gostaria|gostava|take/i)) {
      const qtyMatch = msg.match(/(\d+)/);
      const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

      return {
        type: 'ADD_TO_CART',
        quantity,
        confidence: 0.9,
      };
    }

    // [3] CONFIRM
    if (msg.match(/confirm|ok|pronto|fechado|finaliz|isso|done|yes|sim/i)) {
      return {
        type: 'CONFIRM',
        confidence: 0.95,
      };
    }

    // [4] CANCEL
    if (msg.match(/cancel|desist|não|nunca|nope|volta|apaga/i)) {
      return {
        type: 'CANCEL',
        confidence: 0.9,
      };
    }

    // [5] VIEW CART
    if (msg.match(/mostra|quanto|total|resumo|list|meu.*pedid/i)) {
      return {
        type: 'VIEW_CART',
        confidence: 0.85,
      };
    }

    // DEFAULT: General question
    return {
      type: 'GENERAL',
      confidence: 0.0,
    };
  }

  /**
   * Extrair nome do produto da mensagem
   */
  static extractProductName(message: string): string | null {
    // Padrões comuns
    const patterns = [
      /(?:do|da|de)\s+([a-záéíóú\s]+?)(?:\?|$)/i, // "do vinho tinto"
      /(?:quero|levo|peço)\s+([a-záéíóú\s]+?)(?:\?|$)/i, // "quero vinho"
      /de\s+([a-záéíóú\s]+)/i, // "de cerveja"
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1]?.trim();
      }
    }

    return null;
  }

  /**
   * Extrair quantidade da mensagem
   */
  static extractQuantity(message: string): number {
    const match = message.match(/(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }
}
```

---

### FASE 4: Integração com IAService (1h)

#### 4.1 Atualizar IAService

```typescript
// apps/backend/src/modules/ia/ia.service.ts (adicionar ao constructor e método)

export class IAService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wordPressService: WordPressService,
    private readonly cartService: CartService, // NOVO
  ) {
    // ... existing code ...
  }

  /**
   * Processar mensagem COM SUPORTE A CARRINHO
   */
  async processMessage(dto: ProcessMessageDto) {
    const {
      tenantId,
      chatId,
      contactId,
      userMessage,
      provider = AIProvider.OPENAI,
    } = dto;

    // [NOVO] Detectar intenção (SEM IA, puro regex)
    const intent = IntentDetector.detect(userMessage);

    this.logger.log(`Intent detected: ${intent.type} (confidence: ${intent.confidence})`);

    // [NOVO] Processar conforme intenção

    // 1. PRICE CHECK
    if (intent.type === 'PRICE_CHECK') {
      return this.handlePriceCheck(intent.product, tenantId, chatId, contactId);
    }

    // 2. ADD TO CART
    if (intent.type === 'ADD_TO_CART') {
      return this.handleAddToCart(userMessage, intent.quantity, chatId, contactId, tenantId);
    }

    // 3. CONFIRM
    if (intent.type === 'CONFIRM') {
      return this.handleConfirmOrder(chatId);
    }

    // 4. CANCEL
    if (intent.type === 'CANCEL') {
      return this.handleCancelOrder(chatId);
    }

    // 5. VIEW CART
    if (intent.type === 'VIEW_CART') {
      return this.handleViewCart(chatId);
    }

    // DEFAULT: Usar IA normal
    return this.handleGeneralMessage(dto);
  }

  /**
   * Handle: Pesquisar preço
   */
  private async handlePriceCheck(
    productName: string | undefined,
    tenantId: string,
    chatId: string,
    contactId: string,
  ) {
    if (!productName) {
      return {
        response: 'Qual produto você quer saber o preço?',
        intent: 'PRICE_CHECK',
      };
    }

    try {
      // Buscar no WordPress
      const wpProducts = await this.wordPressService.getProductsForAIContext(
        tenantId,
        productName,
        1,
      );

      if (wpProducts.length === 0) {
        return {
          response: `Desculpe, não encontrei "${productName}" no catálogo`,
          intent: 'PRICE_CHECK',
        };
      }

      const product = wpProducts[0];

      // Criar/atualizar carrinho
      await this.cartService.getOrCreateCart(chatId, contactId, tenantId);

      return {
        response: `${product.name} custa **R$ ${Number(product.price).toFixed(2)}** por unidade.\n\nQuer adicionar ao pedido?`,
        product: {
          name: product.name,
          price: product.price,
          wpProductId: product.wpProductId,
        },
        intent: 'PRICE_CHECK',
      };
    } catch (error) {
      this.logger.error(`Price check error: ${error.message}`);
      return {
        response: 'Erro ao buscar preço. Tente novamente.',
        intent: 'PRICE_CHECK',
      };
    }
  }

  /**
   * Handle: Adicionar ao carrinho
   */
  private async handleAddToCart(
    userMessage: string,
    quantity: number,
    chatId: string,
    contactId: string,
    tenantId: string,
  ) {
    try {
      // Extrair nome do produto
      const productName = IntentDetector.extractProductName(userMessage);

      if (!productName) {
        return {
          response: 'Qual produto você quer adicionar?',
          intent: 'ADD_TO_CART',
        };
      }

      // Buscar produto no carrinho (para não repetir)
      const existingItem = await this.cartService.findItemByName(
        chatId,
        productName,
      );

      if (existingItem) {
        // Atualizar quantidade
        const updatedOrder = await this.cartService.updateItemQuantity(
          existingItem.id,
          quantity,
          chatId,
        );

        const summary = await this.cartService.getCartSummary(chatId);

        return {
          response: `Quantidade atualizada!\n\n${summary}`,
          order: updatedOrder,
          intent: 'ADD_TO_CART',
        };
      }

      // Buscar preço do produto
      const wpProducts = await this.wordPressService.getProductsForAIContext(
        tenantId,
        productName,
        1,
      );

      if (wpProducts.length === 0) {
        return {
          response: `Não encontrei "${productName}" no catálogo.`,
          intent: 'ADD_TO_CART',
        };
      }

      const product = wpProducts[0];

      // Adicionar ao carrinho
      const { order } = await this.cartService.addItem(chatId, {
        chatId,
        contactId,
        tenantId,
        productName: product.name,
        productSourceId: product.wpProductId.toString(),
        productSource: 'WORDPRESS',
        unitPrice: Number(product.price),
        quantity,
      });

      const summary = await this.cartService.getCartSummary(chatId);

      return {
        response: `Adicionado ao pedido!\n\n${summary}\n\nQuer mais algo?`,
        order,
        intent: 'ADD_TO_CART',
      };
    } catch (error) {
      this.logger.error(`Add to cart error: ${error.message}`);
      return {
        response: 'Erro ao adicionar item. Tente novamente.',
        intent: 'ADD_TO_CART',
      };
    }
  }

  /**
   * Handle: Confirmar pedido
   */
  private async handleConfirmOrder(chatId: string) {
    try {
      const message = await this.cartService.confirmOrder(chatId);
      return {
        response: message,
        intent: 'CONFIRM',
        orderId: chatId,
      };
    } catch (error) {
      return {
        response: `Erro ao confirmar: ${error.message}`,
        intent: 'CONFIRM',
      };
    }
  }

  /**
   * Handle: Cancelar pedido
   */
  private async handleCancelOrder(chatId: string) {
    try {
      const message = await this.cartService.cancelOrder(chatId);
      return {
        response: message,
        intent: 'CANCEL',
      };
    } catch (error) {
      return {
        response: 'Erro ao cancelar.',
        intent: 'CANCEL',
      };
    }
  }

  /**
   * Handle: Ver carrinho
   */
  private async handleViewCart(chatId: string) {
    try {
      const summary = await this.cartService.getCartSummary(chatId);
      return {
        response: summary,
        intent: 'VIEW_CART',
      };
    } catch (error) {
      return {
        response: 'Erro ao carregar carrinho.',
        intent: 'VIEW_CART',
      };
    }
  }

  /**
   * Handle: Mensagem geral (fallback para IA)
   */
  private async handleGeneralMessage(dto: ProcessMessageDto) {
    // Código original aqui (chamar OpenAI/Gemini/Ollama)
    // ... (implementação existente)
  }
}
```

---

### FASE 5: DTOs e Módulo (20 min)

#### 5.1 Criar DTOs

```typescript
// apps/backend/src/modules/cart/dto/cart.dto.ts

import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

export enum ProductSource {
  WORDPRESS = 'WORDPRESS',
  LOCAL = 'LOCAL',
  MANUAL = 'MANUAL',
}

export class CreateCartItemDto {
  @IsString()
  chatId: string;

  @IsString()
  contactId: string;

  @IsString()
  tenantId: string;

  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  productSourceId?: string;

  @IsEnum(ProductSource)
  productSource: ProductSource;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  quantity: number;
}

export class UpdateCartItemDto {
  @IsNumber()
  quantity: number;
}

export class GetCartSummaryDto {
  @IsString()
  chatId: string;
}
```

#### 5.2 Criar Módulo

```typescript
// apps/backend/src/modules/cart/cart.module.ts

import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { PrismaModule } from '../../shared/prisma.module';
import { RedisService } from '../../shared/redis.service';
import { WordPressModule } from '../wordpress/wordpress.module';

@Module({
  imports: [PrismaModule, WordPressModule],
  providers: [CartService, RedisService],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}
```

#### 5.3 Criar Controller

```typescript
// apps/backend/src/modules/cart/cart.controller.ts

import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartItemDto, UpdateCartItemDto, GetCartSummaryDto } from './dto/cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('items')
  async addItem(@Body() dto: CreateCartItemDto) {
    return this.cartService.addItem(dto.chatId, dto);
  }

  @Get(':chatId/summary')
  async getSummary(@Param('chatId') chatId: string) {
    const summary = await this.cartService.getCartSummary(chatId);
    return { summary };
  }

  @Get(':chatId/items')
  async listItems(@Param('chatId') chatId: string) {
    return this.cartService.listItems(chatId);
  }

  @Delete('items/:itemId/:chatId')
  async removeItem(
    @Param('itemId') itemId: string,
    @Param('chatId') chatId: string,
  ) {
    return this.cartService.removeItem(itemId, chatId);
  }

  @Post(':chatId/confirm')
  async confirmOrder(@Param('chatId') chatId: string) {
    const message = await this.cartService.confirmOrder(chatId);
    return { message };
  }

  @Post(':chatId/cancel')
  async cancelOrder(@Param('chatId') chatId: string) {
    const message = await this.cartService.cancelOrder(chatId);
    return { message };
  }
}
```

---

### FASE 6: Testes (30 min)

#### 6.1 Teste Manual via cURL

```bash
# [1] Pesquisar preço (PRICE_CHECK)
curl -X POST http://localhost:3000/ia/process-message \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-123",
    "chatId": "chat-456",
    "contactId": "contact-789",
    "userMessage": "Qual o preço do Malbec?"
  }'

# [2] Adicionar ao carrinho (ADD_TO_CART)
curl -X POST http://localhost:3000/ia/process-message \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-123",
    "chatId": "chat-456",
    "contactId": "contact-789",
    "userMessage": "Quero 2 garrafas"
  }'

# [3] Ver resumo (VIEW_CART)
curl -X GET "http://localhost:3000/cart/chat-456/summary"

# [4] Confirmar (CONFIRM)
curl -X POST http://localhost:3000/cart/chat-456/confirm

# [5] Verificar no banco
SELECT * FROM "Order" WHERE status='CONFIRMED';
SELECT * FROM "OrderItem";
```

#### 6.2 Teste de Conversa Completa

```bash
#!/bin/bash

CHAT_ID="test-chat-$(date +%s)"
TENANT_ID="tenant-123"
CONTACT_ID="contact-456"

echo "=== TESTE DE CARRINHO ==="
echo "Chat ID: $CHAT_ID"
echo ""

# [1]
echo "[1] Cliente: Qual o preço do Malbec?"
curl -s -X POST http://localhost:3000/ia/process-message \
  -H "Content-Type: application/json" \
  -d "{\"tenantId\":\"$TENANT_ID\", \"chatId\":\"$CHAT_ID\", \"contactId\":\"$CONTACT_ID\", \"userMessage\":\"Qual o preço do Malbec?\"}" | jq '.response'

# [2]
echo ""
echo "[2] Cliente: Quero 2 garrafas"
curl -s -X POST http://localhost:3000/ia/process-message \
  -H "Content-Type: application/json" \
  -d "{\"tenantId\":\"$TENANT_ID\", \"chatId\":\"$CHAT_ID\", \"contactId\":\"$CONTACT_ID\", \"userMessage\":\"Quero 2 garrafas\"}" | jq '.response'

# [3]
echo ""
echo "[3] Cliente: E o Cabernet?"
curl -s -X POST http://localhost:3000/ia/process-message \
  -H "Content-Type: application/json" \
  -d "{\"tenantId\":\"$TENANT_ID\", \"chatId\":\"$CHAT_ID\", \"contactId\":\"$CONTACT_ID\", \"userMessage\":\"E o Cabernet?\"}" | jq '.response'

# [4]
echo ""
echo "[4] Cliente: Levo 1"
curl -s -X POST http://localhost:3000/ia/process-message \
  -H "Content-Type: application/json" \
  -d "{\"tenantId\":\"$TENANT_ID\", \"chatId\":\"$CHAT_ID\", \"contactId\":\"$CONTACT_ID\", \"userMessage\":\"Levo 1\"}" | jq '.response'

# [5]
echo ""
echo "[5] Ver resumo"
curl -s -X GET "http://localhost:3000/cart/$CHAT_ID/summary" | jq '.summary'

# [6]
echo ""
echo "[6] Cliente: Confirma"
curl -s -X POST http://localhost:3000/cart/$CHAT_ID/confirm | jq '.message'

echo ""
echo "=== FIM DO TESTE ==="
```

---

## 📋 Checklist de Implementação

```
FASE 1: Preparação
  [ ] Adicionar modelos Prisma (Order, OrderItem)
  [ ] Executar migração
  [ ] Gerar tipos TypeScript

FASE 2: Redis
  [ ] Criar RedisService
  [ ] Criar CartService
  [ ] Implementar métodos de cache

FASE 3: Intenção
  [ ] Criar IntentDetector
  [ ] Testar padrões regex
  [ ] Validar detecção

FASE 4: Integração
  [ ] Atualizar IAService
  [ ] Integrar CartService
  [ ] Remover chamadas IA desnecessárias

FASE 5: DTOs e Módulo
  [ ] Criar DTOs
  [ ] Criar CartModule
  [ ] Criar CartController

FASE 6: Testes
  [ ] Teste manual via cURL
  [ ] Teste conversa completa
  [ ] Validar cálculos
  [ ] Verificar banco de dados

FASE 7: Deploy
  [ ] Atualizar docker-compose
  [ ] Build backend
  [ ] Deploy em staging
  [ ] Testes em produção
```

---

**Próximo passo:** Quer que eu implemente as Fases 1-2 agora? Ou prefere uma abordagem diferente?
