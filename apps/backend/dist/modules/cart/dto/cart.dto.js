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
exports.ConfirmResponseDto = exports.CartResponseDto = exports.CartItemDto = exports.ConfirmCartDto = exports.RemoveItemDto = exports.UpdateQtyDto = exports.AddItemDto = void 0;
const class_validator_1 = require("class-validator");
const enums_1 = require("../../../shared/enums");
class AddItemDto {
    chatId;
    contactId;
    tenantId;
    productName;
    productSourceId;
    productSource;
    unitPrice;
    quantity;
}
exports.AddItemDto = AddItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddItemDto.prototype, "chatId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddItemDto.prototype, "contactId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddItemDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddItemDto.prototype, "productName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddItemDto.prototype, "productSourceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddItemDto.prototype, "productSource", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AddItemDto.prototype, "unitPrice", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AddItemDto.prototype, "quantity", void 0);
class UpdateQtyDto {
    chatId;
    productSourceId;
    quantity;
}
exports.UpdateQtyDto = UpdateQtyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateQtyDto.prototype, "chatId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateQtyDto.prototype, "productSourceId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateQtyDto.prototype, "quantity", void 0);
class RemoveItemDto {
    chatId;
    productSourceId;
}
exports.RemoveItemDto = RemoveItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RemoveItemDto.prototype, "chatId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RemoveItemDto.prototype, "productSourceId", void 0);
class ConfirmCartDto {
    chatId;
    contactId;
    tenantId;
    notes;
    vendorMode;
}
exports.ConfirmCartDto = ConfirmCartDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmCartDto.prototype, "chatId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmCartDto.prototype, "contactId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmCartDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfirmCartDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.VendorMode),
    __metadata("design:type", String)
], ConfirmCartDto.prototype, "vendorMode", void 0);
class CartItemDto {
    productSourceId;
    productName;
    productSource;
    unitPrice;
    quantity;
    subtotal;
}
exports.CartItemDto = CartItemDto;
class CartResponseDto {
    chatId;
    contactId;
    tenantId;
    items;
    subtotal;
    tax;
    discount;
    total;
    itemCount;
    lastUpdated;
}
exports.CartResponseDto = CartResponseDto;
class ConfirmResponseDto {
    success;
    orderId;
    vendorOrderNumber;
    cartCleared;
    total;
    message;
}
exports.ConfirmResponseDto = ConfirmResponseDto;
//# sourceMappingURL=cart.dto.js.map