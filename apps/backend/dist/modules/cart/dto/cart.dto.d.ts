import { VendorMode } from '../../../shared/enums';
export declare class AddItemDto {
    chatId: string;
    contactId: string;
    tenantId: string;
    productName: string;
    productSourceId?: string;
    productSource?: string;
    unitPrice: number;
    quantity: number;
}
export declare class UpdateQtyDto {
    chatId: string;
    productSourceId: string;
    quantity: number;
}
export declare class RemoveItemDto {
    chatId: string;
    productSourceId: string;
}
export declare class ConfirmCartDto {
    chatId: string;
    contactId: string;
    tenantId: string;
    notes?: string;
    vendorMode?: VendorMode;
}
export declare class CartItemDto {
    productSourceId: string;
    productName: string;
    productSource: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
}
export declare class CartResponseDto {
    chatId: string;
    contactId: string;
    tenantId: string;
    items: CartItemDto[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    itemCount: number;
    lastUpdated: Date;
}
export declare class ConfirmResponseDto {
    success: boolean;
    orderId: string;
    vendorOrderNumber: string;
    cartCleared: boolean;
    total: number;
    message: string;
}
