import { IsString, IsNumber, IsOptional, IsEnum, IsDecimal } from 'class-validator';
import { VendorMode } from '@prisma/client';

export class AddItemDto {
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
  productSourceId?: string; // ID do WordPress ou local

  @IsOptional()
  @IsString()
  productSource?: string; // 'WORDPRESS' | 'LOCAL'

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  quantity: number;
}

export class UpdateQtyDto {
  @IsString()
  chatId: string;

  @IsString()
  productSourceId: string;

  @IsNumber()
  quantity: number;
}

export class RemoveItemDto {
  @IsString()
  chatId: string;

  @IsString()
  productSourceId: string;
}

export class ConfirmCartDto {
  @IsString()
  chatId: string;

  @IsString()
  contactId: string;

  @IsString()
  tenantId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(VendorMode)
  vendorMode?: VendorMode; // SELLER, SERVICE, SUPPORT
}

export class CartItemDto {
  productSourceId: string;
  productName: string;
  productSource: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export class CartResponseDto {
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

export class ConfirmResponseDto {
  success: boolean;
  orderId: string;
  vendorOrderNumber: string;
  cartCleared: boolean;
  total: number;
  message: string;
}
