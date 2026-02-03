# 🔧 GUIA DE CORREÇÕES ESPECÍFICAS DE CÓDIGO

> Detalhamento das correções necessárias em cada arquivo  
> Copie-e-cole as soluções prontas

---

## 📁 MÓDULO: TTS (Text-to-Speech)

### Arquivo: `apps/backend/src/modules/tts/tts.module.ts`

**Problema**: HttpService não importado

```typescript
// ❌ ANTES
import { Module } from '@nestjs/common';
import { TTSService } from './tts.service';
import { TTSController } from './tts.controller';
import { PrismaModule } from '../../shared/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TTSController],
  providers: [TTSService],
})
export class TTSModule {}

// ✅ DEPOIS
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TTSService } from './tts.service';
import { TTSController } from './tts.controller';
import { PrismaModule } from '../../shared/prisma.module';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [TTSController],
  providers: [TTSService],
})
export class TTSModule {}
```

### Arquivo: `apps/backend/src/modules/tts/tts.service.ts`

**Problema**: HttpModule não injetado corretamente

```typescript
// ❌ ANTES (linha ~15)
export class TTSService {
  private ollamaApiUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';

  constructor(
    private httpService: HttpService,  // ← Type error se HttpService não importado
    private prisma: PrismaService,
  ) {}

// ✅ DEPOIS - Verificar que HttpService está tipado:
import { HttpService } from '@nestjs/axios';
import { HttpClient } from '@angular/common/http'; // NÃO ISSO!

export class TTSService {
  private ollamaApiUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';

  constructor(
    private httpService: HttpService,  // ← De @nestjs/axios
    private prisma: PrismaService,
  ) {}

  // Usar no método:
  async callOllamaTTS(text: string, language: string, voice: string, speed: number) {
    try {
      const response = await this.httpService
        .post(`${this.ollamaApiUrl}/api/tts`, {
          text,
          language,
          voice,
          speed
        })
        .toPromise();  // ← Necessário para converter Observable para Promise
      
      return response.data;
    } catch (error) {
      throw new BadRequestException('TTS generation failed: ' + error.message);
    }
  }
}
```

---

## 📁 MÓDULO: USER

### Arquivo: `apps/backend/src/modules/user/user.service.ts`

**Problema**: bcrypt não tipado, functions retornam any

```typescript
// ❌ ANTES (linha ~1-5)
import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { UserCreateDto, UserPreferencesDto, UserResponseDto } from './dto/user.dto';
import { UserStatus, UserRole, VendorMode } from '@prisma/client';
import * as bcrypt from 'bcrypt';  // ← Sem tipos

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(dto: UserCreateDto): Promise<UserResponseDto> {
    // ...
    const hashedPassword = await bcrypt.hash(dto.password, 10);  // Type unsafe
    // ...
    return this.mapToResponseDto(user);
  }

  async updatePreferences(userId: string, dto: UserPreferencesDto): Promise<any> {  // ← any!
    // ...
  }

  private mapToResponseDto(user: any): UserResponseDto {  // ← any!
    // ...
  }
}

// ✅ DEPOIS
import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { UserCreateDto, UserPreferencesDto, UserResponseDto } from './dto/user.dto';
import { User, UserPreferences, UserStatus, UserRole, VendorMode } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(dto: UserCreateDto): Promise<UserResponseDto> {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId: dto.tenantId },
    });

    if (existingUser) {
      throw new ConflictException('Usuário já existe com este email');
    }

    const hashedPassword: string = await bcrypt.hash(dto.password, 10);  // ✓ Typed

    const user: User = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        role: dto.role,
        password: hashedPassword,
        status: UserStatus.PENDING_ONBOARDING,
        tenantId: dto.tenantId,
      },
      include: { preferences: true },
    });

    return this.mapToResponseDto(user);
  }

  async updatePreferences(
    userId: string,
    dto: UserPreferencesDto,
  ): Promise<UserPreferences> {  // ✓ Typed
    const existingPreferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (existingPreferences) {
      return this.prisma.userPreferences.update({
        where: { userId },
        data: {
          operationMode: dto.operationMode || existingPreferences.operationMode,
          audioEnabled: dto.audioEnabled ?? existingPreferences.audioEnabled,
          timezone: dto.timezone || existingPreferences.timezone,
        },
      });
    }

    return this.prisma.userPreferences.create({
      data: {
        userId,
        operationMode: dto.operationMode,
        audioEnabled: dto.audioEnabled ?? true,
      },
    });
  }

  private mapToResponseDto(user: User & { preferences?: UserPreferences | null }): UserResponseDto {  // ✓ Typed
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      preferences: user.preferences ? {
        audioEnabled: user.preferences.audioEnabled,
        audioLanguage: user.preferences.audioLanguage,
        timezone: user.preferences.timezone,
      } : undefined,
    };
  }
}
```

---

## 📁 MÓDULO: PAYMENT

### Arquivo: `apps/backend/src/modules/payment/payment.service.ts`

**Problema**: Decimal não convertido para number

```typescript
// ❌ ANTES (linha ~50-100)
import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { UploadPaymentProofDto, ValidatePaymentProofDto, PaymentProofResponseDto } from './dto/payment.dto';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async getPaymentStats() {
    const stats = await this.prisma.order.aggregate({
      _sum: { total: true },  // ← Retorna Decimal
      _count: true,
    });

    // ❌ Erro de tipo
    const totalAmount = stats._sum.total + 100;  // Decimal + number
    return {
      totalOrders: stats._count,
      totalAmount: totalAmount,  // ← Type error!
    };
  }
}

// ✅ DEPOIS
import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { UploadPaymentProofDto, ValidatePaymentProofDto, PaymentProofResponseDto } from './dto/payment.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { toNumber, toDecimal, addDecimal } from '../../shared/utils/decimal.helper';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async getPaymentStats() {
    const stats = await this.prisma.order.aggregate({
      _sum: { total: true },
      _count: true,
    });

    // ✓ Converter Decimal para number
    const totalAmount = toNumber(stats._sum.total);
    return {
      totalOrders: stats._count,
      totalAmount: totalAmount,  // ✓ Type safe
    };
  }

  async calculateOrderTotal(orderId: string): Promise<number> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    // ✓ Usar helper para operações matemáticas
    let total = toDecimal(0);
    
    for (const item of order.items) {
      const itemSubtotal = toDecimal(toNumber(item.unitPrice) * item.quantity);
      total = addDecimal(total, itemSubtotal);
    }

    // Adicionar tax e discount
    total = addDecimal(total, order.tax);
    total = addDecimal(total, order.discount);

    // ✓ Retornar como number
    return toNumber(total);
  }
}
```

---

## 📁 SHARED: Utilitários para Decimal

### Arquivo: `apps/backend/src/shared/utils/decimal.helper.ts` (CRIAR NOVO)

```typescript
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Utilities para trabalhar com Prisma Decimal
 * Use estas funções em todo o código para garantir type safety
 */

/**
 * Converter Prisma Decimal para JavaScript number
 * @param value Valor Decimal ou null/undefined
 * @returns number seguro
 */
export function toNumber(value: Decimal | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number(value.toString());
}

/**
 * Converter número para Prisma Decimal
 * @param value Número ou string
 * @returns Decimal
 */
export function toDecimal(value: number | string | Decimal | null | undefined): Decimal {
  if (value === null || value === undefined) return new Decimal(0);
  if (value instanceof Decimal) return value;
  return new Decimal(value.toString());
}

/**
 * Somar dois valores Decimal
 */
export function addDecimal(a: Decimal | null, b: Decimal | null): Decimal {
  const aNum = toNumber(a);
  const bNum = toNumber(b);
  return toDecimal(aNum + bNum);
}

/**
 * Subtrair dois valores Decimal
 */
export function subtractDecimal(a: Decimal | null, b: Decimal | null): Decimal {
  const aNum = toNumber(a);
  const bNum = toNumber(b);
  return toDecimal(aNum - bNum);
}

/**
 * Multiplicar Decimal por número
 */
export function multiplyDecimal(value: Decimal | null, multiplier: number): Decimal {
  const valueNum = toNumber(value);
  return toDecimal(valueNum * multiplier);
}

/**
 * Dividir Decimal por número
 */
export function divideDecimal(value: Decimal | null, divisor: number): Decimal {
  if (divisor === 0) throw new Error('Division by zero');
  const valueNum = toNumber(value);
  return toDecimal(valueNum / divisor);
}

/**
 * Comparar dois Decimal values
 */
export function compareDecimal(a: Decimal | null, b: Decimal | null): -1 | 0 | 1 {
  const aNum = toNumber(a);
  const bNum = toNumber(b);
  if (aNum < bNum) return -1;
  if (aNum > bNum) return 1;
  return 0;
}

/**
 * Formatar Decimal para string monetária (BRL)
 */
export function formatCurrency(value: Decimal | null): string {
  const num = toNumber(value);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

/**
 * Validar se é número válido (não Infinity, não NaN)
 */
export function isValidDecimal(value: Decimal | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  const num = toNumber(value);
  return Number.isFinite(num);
}
```

---

## 📁 SHARED: Queue Helpers

### Arquivo: `apps/backend/src/shared/utils/job.helper.ts` (CRIAR NOVO)

```typescript
import { Job } from 'bull';

/**
 * Helper para tipar Jobs corretamente em testes
 */

export interface BaseJobData {
  tenantId: string;
  [key: string]: any;
}

/**
 * Criar mock job para testes
 */
export function createMockJob<T extends BaseJobData>(
  jobData: T,
  overrides?: Partial<Job<T>>
): Partial<Job<T>> {
  return {
    id: Math.random().toString(36),
    name: 'test-job',
    data: jobData,
    progress: jest.fn(),
    log: jest.fn(),
    updateProgress: jest.fn(),
    updateData: jest.fn(),
    remove: jest.fn(),
    retry: jest.fn(),
    discard: jest.fn(),
    moveToCompleted: jest.fn(),
    moveToFailed: jest.fn(),
    isCompleted: jest.fn().mockReturnValue(false),
    isFailed: jest.fn().mockReturnValue(false),
    isStalled: jest.fn().mockReturnValue(false),
    isActive: jest.fn().mockReturnValue(false),
    isDelayed: jest.fn().mockReturnValue(false),
    isDone: jest.fn().mockReturnValue(false),
    addListener: jest.fn().mockReturnThis(),
    removeListener: jest.fn().mockReturnThis(),
    ...overrides,
  };
}

/**
 * Assertar que job foi processado corretamente
 */
export function assertJobProcessed<T>(job: Partial<Job<T>>, expectedData: T) {
  expect(job.data).toEqual(expectedData);
  expect(job.progress).toBeDefined();
}
```

---

## 📁 TESTS: Corrigir Specs

### Arquivo: `apps/backend/src/shared/processors/audio.processor.spec.ts`

**Problema**: Job type mismatch

```typescript
// ❌ ANTES (linha ~63)
import { Test, TestingModule } from '@nestjs/testing';
import { AudioProcessor } from './audio.processor';
import { PrismaService } from '../prisma.service';

describe('AudioProcessor', () => {
  let processor: AudioProcessor;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AudioProcessor,
        {
          provide: PrismaService,
          useValue: { audioMessage: { update: jest.fn() } },
        },
      ],
    }).compile();

    processor = module.get<AudioProcessor>(AudioProcessor);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('handleAudioTranscription', () => {
    it('should transcribe audio successfully', async () => {
      const job: any = {
        id: string;
        data: { audioUrl: string; chatId: string; tenantId: string; language: string };
        progress: jest.Mock<any, any, any>;
      };

      const result = await processor.handleAudioTranscription(job);
      expect(result).toBeDefined();
    });
  });
});

// ✅ DEPOIS
import { Test, TestingModule } from '@nestjs/testing';
import { AudioProcessor } from './audio.processor';
import { PrismaService } from '../prisma.service';
import { Job } from 'bull';
import { createMockJob } from '../utils/job.helper';

describe('AudioProcessor', () => {
  let processor: AudioProcessor;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AudioProcessor,
        {
          provide: PrismaService,
          useValue: {
            audioMessage: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    processor = module.get<AudioProcessor>(AudioProcessor);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('handleAudioTranscription', () => {
    it('should transcribe audio successfully', async () => {
      // ✓ Usar mock factory
      const jobData = {
        audioUrl: 'http://example.com/audio.mp3',
        chatId: 'chat-123',
        tenantId: 'tenant-123',
        language: 'pt-BR',
      };

      const job = createMockJob(jobData) as Job<typeof jobData>;

      // Mock Prisma response
      (prismaService.audioMessage.findUnique as jest.Mock).mockResolvedValue({
        id: 'audio-1',
        status: 'RECEIVED',
      });

      (prismaService.audioMessage.update as jest.Mock).mockResolvedValue({
        id: 'audio-1',
        status: 'TRANSCRIBED',
        transcript: 'Hello world',
      });

      const result = await processor.handleAudioTranscription(job as any);

      expect(result).toBeDefined();
      expect(result.status).toBe('TRANSCRIBED');
      expect(prismaService.audioMessage.update).toHaveBeenCalled();
    });
  });
});
```

---

## 📁 CART: Array Generic Types

### Arquivo: `apps/backend/src/modules/cart/cart.service.ts`

**Problema**: Array sem tipo genérico

```typescript
// ❌ ANTES
export class CartService {
  async getCartItems(chatId: string): Promise<Array> {  // ← Array sem tipo!
    const items = await this.prisma.orderItem.findMany({
      where: { order: { chatId } },
    });
    return items;
  }

  async addToCart(chatId: string, items: Array) {  // ← Array sem tipo!
    for (const item of items) {
      // item não tem types
    }
  }
}

// ✅ DEPOIS
import { OrderItem, Prisma } from '@prisma/client';

export interface CartItemDto {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCartItems(chatId: string): Promise<Array<OrderItem>> {  // ✓ Tipado
    const items = await this.prisma.orderItem.findMany({
      where: { order: { chatId } },
    });
    return items;
  }

  async addToCart(chatId: string, items: Array<CartItemDto>): Promise<OrderItem[]> {  // ✓ Tipado
    const order = await this.prisma.order.findFirst({
      where: { chatId },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const createdItems: OrderItem[] = [];

    for (const item of items) {  // ✓ item tem propriedades bem definidas
      const created = await this.prisma.orderItem.create({
        data: {
          orderId: order.id,
          productName: item.productName,
          unitPrice: new Decimal(item.unitPrice),
          quantity: item.quantity,
          subtotal: new Decimal(item.unitPrice * item.quantity),
        },
      });
      createdItems.push(created);
    }

    return createdItems;
  }
}
```

---

## 📋 CHECKLIST DE APLICAÇÃO

- [ ] TTS Module - importar HttpModule
- [ ] User Service - remover `any` types
- [ ] Payment Service - converter Decimal
- [ ] Criar `decimal.helper.ts`
- [ ] Criar `job.helper.ts`
- [ ] Atualizar `audio.processor.spec.ts`
- [ ] Atualizar `cart.service.ts`
- [ ] Adicionar tipos genéricos em todos Array
- [ ] `npm run lint --fix`
- [ ] `npm run build`

---

**Status**: Pronto para copiar-e-colar  
**Próximo**: Aplique estas correções no seu código
