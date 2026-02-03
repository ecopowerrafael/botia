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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartController = void 0;
const common_1 = require("@nestjs/common");
const cart_service_1 = require("./cart.service");
const cart_dto_1 = require("./dto/cart.dto");
let CartController = class CartController {
    cartService;
    constructor(cartService) {
        this.cartService = cartService;
    }
    async addItem(dto) {
        return this.cartService.addItem(dto);
    }
    async getCart(tenantId, chatId) {
        return this.cartService.getCart(tenantId, chatId);
    }
    async updateQty(dto) {
        return this.cartService.updateQty(dto);
    }
    async removeItem(dto) {
        return this.cartService.removeItem(dto);
    }
    async confirmCart(dto) {
        return this.cartService.confirmCart(dto);
    }
    async clearCart(tenantId, chatId) {
        await this.cartService.clearCart(tenantId, chatId);
        return { success: true, message: 'Carrinho limpo' };
    }
};
exports.CartController = CartController;
__decorate([
    (0, common_1.Post)('add-item'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cart_dto_1.AddItemDto]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "addItem", null);
__decorate([
    (0, common_1.Get)(':tenantId/:chatId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('chatId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "getCart", null);
__decorate([
    (0, common_1.Post)('update-qty'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cart_dto_1.UpdateQtyDto]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "updateQty", null);
__decorate([
    (0, common_1.Post)('remove-item'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cart_dto_1.RemoveItemDto]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "removeItem", null);
__decorate([
    (0, common_1.Post)('confirm'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cart_dto_1.ConfirmCartDto]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "confirmCart", null);
__decorate([
    (0, common_1.Delete)(':tenantId/:chatId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('chatId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "clearCart", null);
exports.CartController = CartController = __decorate([
    (0, common_1.Controller)('cart'),
    __metadata("design:paramtypes", [cart_service_1.CartService])
], CartController);
//# sourceMappingURL=cart.controller.js.map