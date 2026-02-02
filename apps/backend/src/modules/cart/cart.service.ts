import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import {
  AddItemDto,
  UpdateQtyDto,
  RemoveItemDto,
  ConfirmCartDto,
  CartResponseDto,
  ConfirmResponseDto,
} from './dto/cart.dto';
import { OrderStatus, PaymentStatus } from '@prisma/client';

/**
 * CartService gerencia carrinho de compras
 * - Cache em memória (Redis TODO)
 * - Persistência em PostgreSQL ao confirmar
 */
@Injectable()
export class CartService {
  // Cache em memória (substituir por Redis em produção)
  private carts: Map<string, any> = new Map();

  constructor(private prisma: PrismaService) {}

  /**
   * Adicionar item ao carrinho
   */
  async addItem(dto: AddItemDto): Promise<CartResponseDto> {
    const cartKey = `${dto.tenantId}:${dto.chatId}`;

    // Obter ou criar carrinho
    let cart = this.carts.get(cartKey) || {
      chatId: dto.chatId,
      contactId: dto.contactId,
      tenantId: dto.tenantId,
      items: [],
      lastUpdated: new Date(),
    };

    // Verificar se item já existe
    const existingItemIndex = cart.items.findIndex(
      (i: any) => i.productSourceId === (dto.productSourceId || dto.productName),
    );

    if (existingItemIndex > -1) {
      // Atualizar quantidade
      cart.items[existingItemIndex].quantity += dto.quantity;
      cart.items[existingItemIndex].subtotal =
        cart.items[existingItemIndex].quantity *
        cart.items[existingItemIndex].unitPrice;
    } else {
      // Adicionar novo item
      cart.items.push({
        productSourceId: dto.productSourceId || dto.productName,
        productName: dto.productName,
        productSource: dto.productSource || 'LOCAL',
        unitPrice: dto.unitPrice,
        quantity: dto.quantity,
        subtotal: dto.unitPrice * dto.quantity,
      });
    }

    cart.lastUpdated = new Date();
    this.carts.set(cartKey, cart);

    return this.getCartResponse(cart);
  }

  /**
   * Obter carrinho atual
   */
  async getCart(tenantId: string, chatId: string): Promise<CartResponseDto> {
    const cartKey = `${tenantId}:${chatId}`;
    const cart = this.carts.get(cartKey);

    if (!cart || cart.items.length === 0) {
      return {
        chatId,
        contactId: '',
        tenantId,
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        itemCount: 0,
        lastUpdated: new Date(),
      };
    }

    return this.getCartResponse(cart);
  }

  /**
   * Atualizar quantidade de item
   */
  async updateQty(dto: UpdateQtyDto): Promise<CartResponseDto> {
    const cartKey = `${dto.chatId}`;
    const cart = this.carts.get(cartKey);

    if (!cart) {
      throw new NotFoundException('Carrinho não encontrado');
    }

    const item = cart.items.find(
      (i: any) => i.productSourceId === dto.productSourceId,
    );

    if (!item) {
      throw new NotFoundException('Item não encontrado no carrinho');
    }

    if (dto.quantity <= 0) {
      // Remover item se quantidade for 0 ou menor
      cart.items = cart.items.filter(
        (i: any) => i.productSourceId !== dto.productSourceId,
      );
    } else {
      item.quantity = dto.quantity;
      item.subtotal = item.quantity * item.unitPrice;
    }

    cart.lastUpdated = new Date();
    return this.getCartResponse(cart);
  }

  /**
   * Remover item do carrinho
   */
  async removeItem(dto: RemoveItemDto): Promise<CartResponseDto> {
    const cartKey = `${dto.chatId}`;
    const cart = this.carts.get(cartKey);

    if (!cart) {
      throw new NotFoundException('Carrinho não encontrado');
    }

    cart.items = cart.items.filter(
      (i: any) => i.productSourceId !== dto.productSourceId,
    );
    cart.lastUpdated = new Date();

    if (cart.items.length === 0) {
      this.carts.delete(cartKey);
    }

    return this.getCartResponse(cart);
  }

  /**
   * Confirmar pedido (salvar no banco)
   */
  async confirmCart(dto: ConfirmCartDto): Promise<ConfirmResponseDto> {
    const cartKey = `${dto.tenantId}:${dto.chatId}`;
    const cart = this.carts.get(cartKey);

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Carrinho vazio');
    }

    // Calcular valores
    const subtotal = cart.items.reduce(
      (sum: number, item: any) => sum + item.subtotal,
      0,
    );
    const tax = subtotal * 0.08; // 8% de taxa
    const discount = 0; // Aplicar cupom depois
    const total = subtotal + tax - discount;

    // Gerar número do pedido
    const now = new Date();
    const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate(),
    ).padStart(2, '0')}`;
    const randomNum = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    const vendorOrderNumber = `#${dateStr}-${randomNum}`;

    // Criar Order no banco
    const order = await this.prisma.order.create({
      data: {
        tenantId: dto.tenantId,
        chatId: dto.chatId,
        contactId: dto.contactId,
        status: OrderStatus.DRAFT,
        paymentStatus: PaymentStatus.PENDING,
        subtotal,
        tax,
        discount,
        total,
        notes: dto.notes,
        vendorOrderNumber,
        // Criar items
        items: {
          createMany: {
            data: cart.items.map((item: any) => ({
              productName: item.productName,
              productSourceId: item.productSourceId,
              productSource: item.productSource,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
        },
      },
      include: {
        items: true,
      },
    });

    // Limpar carrinho
    this.carts.delete(cartKey);

    return {
      success: true,
      orderId: order.id,
      vendorOrderNumber: order.vendorOrderNumber || '',
      cartCleared: true,
      total: order.total,
      message: `Pedido criado: ${vendorOrderNumber}`,
    };
  }

  /**
   * Limpar carrinho
   */
  async clearCart(tenantId: string, chatId: string): Promise<void> {
    const cartKey = `${tenantId}:${chatId}`;
    this.carts.delete(cartKey);
  }

  /**
   * Mapper interno para CartResponse
   */
  private getCartResponse(cart: any): CartResponseDto {
    const subtotal = cart.items.reduce(
      (sum: number, item: any) => sum + item.subtotal,
      0,
    );
    const tax = subtotal * 0.08;
    const discount = 0;
    const total = subtotal + tax - discount;

    return {
      chatId: cart.chatId,
      contactId: cart.contactId,
      tenantId: cart.tenantId,
      items: cart.items,
      subtotal,
      tax,
      discount,
      total,
      itemCount: cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      lastUpdated: cart.lastUpdated,
    };
  }
}
