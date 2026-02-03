"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma.service");
const enums_1 = require("../../shared/enums");
let CartService = class CartService {
    prisma;
    carts = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async addItem(dto) {
        const cartKey = `${dto.tenantId}:${dto.chatId}`;
        let cart = this.carts.get(cartKey) || {
            chatId: dto.chatId,
            contactId: dto.contactId,
            tenantId: dto.tenantId,
            items: [],
            lastUpdated: new Date(),
        };
        const existingItemIndex = cart.items.findIndex((i) => i.productSourceId === (dto.productSourceId || dto.productName));
        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += dto.quantity;
            cart.items[existingItemIndex].subtotal =
                cart.items[existingItemIndex].quantity *
                    cart.items[existingItemIndex].unitPrice;
        }
        else {
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
    async getCart(tenantId, chatId) {
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
    async updateQty(dto) {
        const cartKey = `${dto.chatId}`;
        const cart = this.carts.get(cartKey);
        if (!cart) {
            throw new common_1.NotFoundException('Carrinho não encontrado');
        }
        const item = cart.items.find((i) => i.productSourceId === dto.productSourceId);
        if (!item) {
            throw new common_1.NotFoundException('Item não encontrado no carrinho');
        }
        if (dto.quantity <= 0) {
            cart.items = cart.items.filter((i) => i.productSourceId !== dto.productSourceId);
        }
        else {
            item.quantity = dto.quantity;
            item.subtotal = item.quantity * item.unitPrice;
        }
        cart.lastUpdated = new Date();
        return this.getCartResponse(cart);
    }
    async removeItem(dto) {
        const cartKey = `${dto.chatId}`;
        const cart = this.carts.get(cartKey);
        if (!cart) {
            throw new common_1.NotFoundException('Carrinho não encontrado');
        }
        cart.items = cart.items.filter((i) => i.productSourceId !== dto.productSourceId);
        cart.lastUpdated = new Date();
        if (cart.items.length === 0) {
            this.carts.delete(cartKey);
        }
        return this.getCartResponse(cart);
    }
    async confirmCart(dto) {
        const cartKey = `${dto.tenantId}:${dto.chatId}`;
        const cart = this.carts.get(cartKey);
        if (!cart || cart.items.length === 0) {
            throw new common_1.BadRequestException('Carrinho vazio');
        }
        const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
        const tax = subtotal * 0.08;
        const discount = 0;
        const total = subtotal + tax - discount;
        const now = new Date();
        const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const randomNum = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        const vendorOrderNumber = `#${dateStr}-${randomNum}`;
        const order = await this.prisma.order.create({
            data: {
                tenantId: dto.tenantId,
                chatId: dto.chatId,
                contactId: dto.contactId,
                status: enums_1.OrderStatus.DRAFT,
                paymentStatus: enums_1.PaymentStatus.PENDING,
                subtotal,
                tax,
                discount,
                total,
                notes: dto.notes,
                vendorOrderNumber,
                items: {
                    createMany: {
                        data: cart.items.map((item) => ({
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
    async clearCart(tenantId, chatId) {
        const cartKey = `${tenantId}:${chatId}`;
        this.carts.delete(cartKey);
    }
    getCartResponse(cart) {
        const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
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
            itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
            lastUpdated: cart.lastUpdated,
        };
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CartService);
//# sourceMappingURL=cart.service.js.map