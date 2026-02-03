import { CartService } from './cart.service';
import { AddItemDto, UpdateQtyDto, RemoveItemDto, ConfirmCartDto } from './dto/cart.dto';
export declare class CartController {
    private cartService;
    constructor(cartService: CartService);
    addItem(dto: AddItemDto): Promise<import("./dto/cart.dto").CartResponseDto>;
    getCart(tenantId: string, chatId: string): Promise<import("./dto/cart.dto").CartResponseDto>;
    updateQty(dto: UpdateQtyDto): Promise<import("./dto/cart.dto").CartResponseDto>;
    removeItem(dto: RemoveItemDto): Promise<import("./dto/cart.dto").CartResponseDto>;
    confirmCart(dto: ConfirmCartDto): Promise<import("./dto/cart.dto").ConfirmResponseDto>;
    clearCart(tenantId: string, chatId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
