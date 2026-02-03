import { PrismaService } from '../../shared/prisma.service';
import { AddItemDto, UpdateQtyDto, RemoveItemDto, ConfirmCartDto, CartResponseDto, ConfirmResponseDto } from './dto/cart.dto';
export declare class CartService {
    private prisma;
    private carts;
    constructor(prisma: PrismaService);
    addItem(dto: AddItemDto): Promise<CartResponseDto>;
    getCart(tenantId: string, chatId: string): Promise<CartResponseDto>;
    updateQty(dto: UpdateQtyDto): Promise<CartResponseDto>;
    removeItem(dto: RemoveItemDto): Promise<CartResponseDto>;
    confirmCart(dto: ConfirmCartDto): Promise<ConfirmResponseDto>;
    clearCart(tenantId: string, chatId: string): Promise<void>;
    private getCartResponse;
}
