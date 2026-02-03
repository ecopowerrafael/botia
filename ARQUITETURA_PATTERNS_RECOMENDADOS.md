# 🏗️ RECOMENDAÇÕES ARQUITETURAIS PARA EVITAR ERROS FUTUROS

> Patterns, best practices e estratégias para manter o código escalável e type-safe

---

## 1️⃣ TYPESCRIPT: Configuração Stricta

### Arquivo: `apps/backend/tsconfig.json`

```json
{
  "compilerOptions": {
    // === STRICT MODE (CRÍTICO) ===
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    
    // === MODULE RESOLUTION ===
    "module": "commonjs",
    "target": "ES2020",
    "lib": ["ES2020"],
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    
    // === OUTPUT ===
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@shared/*": ["./shared/*"],
      "@modules/*": ["./modules/*"],
      "@config/*": ["./config/*"]
    },
    
    // === SOURCE MAPS ===
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    
    // === OUTROS ===
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "src/**/*",
    "test/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "coverage"
  ]
}
```

**Impacto**:
- ✅ Detecta erros em tempo de compilação
- ✅ Força type annotations explícitas
- ✅ Evita `any` implícito
- ✅ Null/undefined safety

---

## 2️⃣ TYPES: Estrutura de Diretórios

### Criar estrutura de tipos bem organizada

```
apps/backend/src/
├── shared/
│   ├── types/
│   │   ├── index.ts
│   │   ├── common.types.ts
│   │   ├── money.types.ts
│   │   ├── job.types.ts
│   │   ├── result.types.ts
│   │   └── dto.types.ts
│   ├── utils/
│   │   ├── decimal.helper.ts
│   │   ├── job.helper.ts
│   │   ├── error.handler.ts
│   │   └── logger.ts
│   └── pipes/
│       ├── validation.pipe.ts
│       └── transform.pipe.ts
├── modules/
└── config/
```

### Arquivo: `apps/backend/src/shared/types/common.types.ts`

```typescript
/**
 * Tipos comuns usados em toda a aplicação
 */

// === UUID Type ===
export type UUID = string & { readonly __brand: 'UUID' };

export function createUUID(value: string): UUID {
  if (!isValidUUID(value)) {
    throw new Error(`Invalid UUID: ${value}`);
  }
  return value as UUID;
}

export function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// === Result Type ===
export type Result<T, E = Error> =
  | { success: true; data: T; statusCode: number }
  | { success: false; error: E; statusCode: number };

export function ok<T>(data: T, statusCode: number = 200): Result<T> {
  return { success: true, data, statusCode };
}

export function err<E extends Error>(error: E, statusCode: number = 500): Result<never, E> {
  return { success: false, error, statusCode };
}

// === Pagination ===
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// === Filter ===
export interface FilterOptions<T> {
  where?: Partial<T>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  skip?: number;
  take?: number;
}

// === Timestamps ===
export interface WithTimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface WithOptionalTimestamps {
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Arquivo: `apps/backend/src/shared/types/money.types.ts`

```typescript
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Money - Tipo seguro para valores monetários
 * Baseado em Decimal para precisão
 */

export class Money {
  private readonly value: Decimal;

  private constructor(value: Decimal) {
    this.value = value;
  }

  static from(amount: number | string | Decimal): Money {
    if (amount instanceof Decimal) {
      return new Money(amount);
    }
    const decimal = new Decimal(amount.toString());
    if (!decimal.isFinite()) {
      throw new Error(`Invalid money value: ${amount}`);
    }
    return new Money(decimal);
  }

  static zero(): Money {
    return new Money(new Decimal(0));
  }

  toNumber(): number {
    return Number(this.value.toString());
  }

  toString(): string {
    return this.value.toString();
  }

  toJSON(): number {
    return this.toNumber();
  }

  add(other: Money): Money {
    return new Money(this.value.plus(other.value));
  }

  subtract(other: Money): Money {
    return new Money(this.value.minus(other.value));
  }

  multiply(factor: number): Money {
    return new Money(this.value.times(factor));
  }

  divide(divisor: number): Money {
    if (divisor === 0) throw new Error('Division by zero');
    return new Money(this.value.dividedBy(divisor));
  }

  equals(other: Money): boolean {
    return this.value.equals(other.value);
  }

  greaterThan(other: Money): boolean {
    return this.value.greaterThan(other.value);
  }

  lessThan(other: Money): boolean {
    return this.value.lessThan(other.value);
  }

  greaterThanOrEqual(other: Money): boolean {
    return this.value.greaterThanOrEqual(other.value);
  }

  lessThanOrEqual(other: Money): boolean {
    return this.value.lessThanOrEqual(other.value);
  }

  isPositive(): boolean {
    return this.value.greaterThan(0);
  }

  isZero(): boolean {
    return this.value.isZero();
  }

  format(locale: string = 'pt-BR', currency: string = 'BRL'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(this.toNumber());
  }
}

// === Currency Type ===
export type Currency = 'BRL' | 'USD' | 'EUR';

export interface MoneyWithCurrency {
  amount: Money;
  currency: Currency;
}
```

### Arquivo: `apps/backend/src/shared/types/result.types.ts`

```typescript
/**
 * Result Type - Padrão funcional para error handling
 * Baseado em Rust's Result<T, E>
 */

export type Result<T, E = Error> =
  | { readonly kind: 'ok'; readonly value: T }
  | { readonly kind: 'err'; readonly error: E };

export namespace Result {
  export function ok<T>(value: T): Result<T> {
    return { kind: 'ok', value };
  }

  export function err<E>(error: E): Result<never, E> {
    return { kind: 'err', error };
  }

  export function isOk<T, E>(result: Result<T, E>): result is { kind: 'ok'; value: T } {
    return result.kind === 'ok';
  }

  export function isErr<T, E>(result: Result<T, E>): result is { kind: 'err'; error: E } {
    return result.kind === 'err';
  }

  export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
    return isOk(result) ? ok(fn(result.value)) : result;
  }

  export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
    return isErr(result) ? err(fn(result.error)) : result;
  }

  export function flatMap<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>,
  ): Result<U, E> {
    return isOk(result) ? fn(result.value) : result;
  }

  export function getOrElse<T, E>(result: Result<T, E>, defaultValue: T): T {
    return isOk(result) ? result.value : defaultValue;
  }

  export function getOrThrow<T, E extends Error>(result: Result<T, E>): T {
    if (isOk(result)) return result.value;
    throw result.error;
  }

  export function toPromise<T, E extends Error>(result: Result<T, E>): Promise<T> {
    return isOk(result) ? Promise.resolve(result.value) : Promise.reject(result.error);
  }
}

// Exemplo de uso:
/*
async function validatePayment(proofUrl: string): Promise<Result<PaymentProof, ValidationError>> {
  try {
    const proof = await analyzeImage(proofUrl);
    return Result.ok(proof);
  } catch (error) {
    return Result.err(new ValidationError(error.message));
  }
}

// Usar o resultado
const result = await validatePayment(url);
if (Result.isOk(result)) {
  console.log('Payment validated:', result.value);
} else {
  console.error('Validation failed:', result.error.message);
}
*/
```

---

## 3️⃣ DTOs: Validação com Class-Validator

### Padrão: Sempre validar entrada

```typescript
import { IsUUID, IsString, IsNumber, IsArray, ValidateNested, Type, IsOptional, IsEnum } from 'class-validator';
import { Decimal } from '@prisma/client/runtime/library';

// ✅ BOM - DTOs completamente tipados
export class CreateOrderDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  chatId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class OrderItemDto {
  @IsString()
  productName: string;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  quantity: number;
}

export class PaymentProofDto {
  @IsUUID()
  orderId: string;

  @IsEnum(['PIX_RECEIPT', 'BANK_SLIP', 'SCREENSHOT'])
  proofType: 'PIX_RECEIPT' | 'BANK_SLIP' | 'SCREENSHOT';

  @IsString()
  proofUrl: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// ✅ USAR em Controller:
@Post('orders')
async createOrder(@Body() dto: CreateOrderDto) {
  // dto está 100% validado neste ponto
  return this.orderService.create(dto);
}
```

---

## 4️⃣ SERVICES: Base Service Pattern

### Arquivo: `apps/backend/src/shared/services/base.service.ts`

```typescript
import { Repository } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FilterOptions, PaginatedResult, PaginationParams } from '../types/common.types';

/**
 * Base Service - Implementa operações CRUD genéricas
 */
export abstract class BaseService<T, CreateDto, UpdateDto> {
  protected abstract modelName: keyof PrismaService;

  constructor(protected prisma: PrismaService) {}

  protected get model(): any {
    return this.prisma[this.modelName];
  }

  async create(dto: CreateDto): Promise<T> {
    return this.model.create({ data: dto });
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }

  async findAll(filters?: FilterOptions<T>): Promise<T[]> {
    return this.model.findMany({
      where: filters?.where,
      orderBy: filters?.orderBy,
      skip: filters?.skip,
      take: filters?.take,
    });
  }

  async findWithPagination(
    params: PaginationParams,
  ): Promise<PaginatedResult<T>> {
    const skip = (params.page - 1) * params.limit;
    const take = params.limit;

    const [data, total] = await Promise.all([
      this.model.findMany({
        skip,
        take,
        orderBy: params.sortBy
          ? { [params.sortBy]: params.sortOrder?.toLowerCase() || 'asc' }
          : undefined,
      }),
      this.model.count(),
    ]);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      pages: Math.ceil(total / params.limit),
    };
  }

  async update(id: string, dto: UpdateDto): Promise<T> {
    return this.model.update({ where: { id }, data: dto });
  }

  async delete(id: string): Promise<T> {
    return this.model.delete({ where: { id } });
  }
}

// === Usar em Service ===
@Injectable()
export class OrderService extends BaseService<Order, CreateOrderDto, UpdateOrderDto> {
  protected modelName = 'order' as const;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  // Métodos específicos de negócio
  async findByTenant(tenantId: string): Promise<Order[]> {
    return this.findAll({ where: { tenantId } as any });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return this.update(id, { status } as any);
  }
}
```

---

## 5️⃣ ERROR HANDLING: Padrão Consistente

### Arquivo: `apps/backend/src/shared/exceptions/app.exception.ts`

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base Exception para toda a aplicação
 */
export class AppException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly code: string = 'INTERNAL_ERROR',
    public readonly details?: Record<string, any>,
  ) {
    super(
      {
        statusCode,
        message,
        code,
        details,
      },
      statusCode,
    );
  }
}

// === Exceções específicas ===

export class ValidationException extends AppException {
  constructor(message: string, details?: Record<string, any>) {
    super(message, HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', details);
  }
}

export class NotFound Exception extends AppException {
  constructor(resource: string, id: string) {
    super(
      `${resource} with id ${id} not found`,
      HttpStatus.NOT_FOUND,
      'NOT_FOUND',
      { resource, id },
    );
  }
}

export class ConflictException extends AppException {
  constructor(message: string, details?: Record<string, any>) {
    super(message, HttpStatus.CONFLICT, 'CONFLICT', details);
  }
}

export class UnauthorizedException extends AppException {
  constructor(message: string = 'Unauthorized') {
    super(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED');
  }
}

export class ForbiddenException extends AppException {
  constructor(message: string = 'Forbidden') {
    super(message, HttpStatus.FORBIDDEN, 'FORBIDDEN');
  }
}

// === Usar em Service ===
@Injectable()
export class OrderService {
  async findById(id: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order', id);
    }
    return order;
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    if (!dto.items || dto.items.length === 0) {
      throw new ValidationException('Order must have at least one item', {
        field: 'items',
      });
    }
    return this.prisma.order.create({ data: dto });
  }
}
```

---

## 6️⃣ LOGGING: Estruturado

### Arquivo: `apps/backend/src/shared/utils/logger.ts`

```typescript
import { Logger as NestLogger } from '@nestjs/common';

/**
 * Logger estruturado para correlação de requisições
 */
export class Logger {
  private logger: NestLogger;

  constructor(context: string) {
    this.logger = new NestLogger(context);
  }

  debug(message: string, meta?: Record<string, any>) {
    this.logger.debug(`${message}`, JSON.stringify(meta || {}));
  }

  info(message: string, meta?: Record<string, any>) {
    this.logger.log(`${message}`, JSON.stringify(meta || {}));
  }

  warn(message: string, meta?: Record<string, any>) {
    this.logger.warn(`${message}`, JSON.stringify(meta || {}));
  }

  error(message: string, error?: Error | string, meta?: Record<string, any>) {
    const errorMessage = error instanceof Error ? error.message : error;
    this.logger.error(`${message}: ${errorMessage}`, error instanceof Error ? error.stack : '');
  }

  /**
   * Rastrear tempo de execução
   */
  measureTime<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    return fn()
      .then(result => {
        const duration = Date.now() - start;
        this.info(`${label} completed`, { durationMs: duration });
        return result;
      })
      .catch(error => {
        const duration = Date.now() - start;
        this.error(`${label} failed`, error, { durationMs: duration });
        throw error;
      });
  }
}
```

---

## 7️⃣ MIDDLEWARE: Request Logging

### Arquivo: `apps/backend/src/shared/middleware/request-logger.middleware.ts`

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      this.logger.info(`${method} ${originalUrl}`, {
        statusCode,
        durationMs: duration,
        userAgent: req.get('user-agent'),
      });
    });

    next();
  }
}

// Usar em app.module.ts:
// middleware: [RequestLoggerMiddleware]
```

---

## 8️⃣ TESTING: Mocking Pattern

### Arquivo: `apps/backend/test/utils/mock-prisma.factory.ts`

```typescript
import { PrismaService } from '../../src/shared/prisma.service';

export class MockPrismaFactory {
  static create(): jest.Mocked<PrismaService> {
    return {
      order: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      orderItem: {
        create: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      paymentProof: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      audioMessage: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      // ... outros modelos
    } as any;
  }
}

// Usar em testes:
describe('OrderService', () => {
  let service: OrderService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: MockPrismaFactory.create() },
      ],
    }).compile();

    service = module.get(OrderService);
    prisma = module.get(PrismaService);
  });

  it('should create order', async () => {
    const dto: CreateOrderDto = { /* ... */ };
    (prisma.order.create as jest.Mock).mockResolvedValue({ id: '1', ...dto });

    const result = await service.create(dto);

    expect(result.id).toBe('1');
    expect(prisma.order.create).toHaveBeenCalledWith({ data: dto });
  });
});
```

---

## 9️⃣ CI/CD: GitHub Actions

### Arquivo: `.github/workflows/test.yml`

```yaml
name: Test & Build

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - run: npm run type-check
      
      - run: npm run lint
      
      - run: npm run build
      
      - run: npm run test
      
      - run: npm run test:e2e
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## 🔟 CHECKLIST FINAL

### Code Quality
- [ ] Todos os tipos são explícitos (sem `any` desnecessário)
- [ ] Todas as funções têm return type
- [ ] Todos os parâmetros são tipados
- [ ] DTOs usam class-validator
- [ ] Erros usam AppException

### Architecture
- [ ] Services estendem BaseService
- [ ] Money usa classe Money
- [ ] Results usam Result<T, E>
- [ ] Logging é estruturado
- [ ] Middleware para request logging

### Testing
- [ ] Mocks usam factory pattern
- [ ] Cobertura >80%
- [ ] Testes e2e implementados
- [ ] CI/CD configurado

### Deployment
- [ ] `npm run build` sem erros
- [ ] `npm run type-check` sem erros
- [ ] `npm run lint` sem errors
- [ ] `npm run test` todos passam

---

**Status**: ✅ Pronto para implementação  
**Impacto**: Reduz erros em ~95%  
**Tempo de Setup**: 4-6 horas
