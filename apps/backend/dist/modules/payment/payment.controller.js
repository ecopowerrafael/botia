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
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("./payment.service");
const payment_dto_1 = require("./dto/payment.dto");
let PaymentController = class PaymentController {
    paymentService;
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    async uploadPaymentProof(dto) {
        return this.paymentService.uploadPaymentProof(dto);
    }
    async validatePaymentProof(dto) {
        return this.paymentService.validatePaymentProof(dto);
    }
    async getPaymentProof(orderId) {
        return this.paymentService.getPaymentProof(orderId);
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('upload-proof'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_dto_1.UploadPaymentProofDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "uploadPaymentProof", null);
__decorate([
    (0, common_1.Post)('validate-proof'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_dto_1.ValidatePaymentProofDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "validatePaymentProof", null);
__decorate([
    (0, common_1.Get)('proof/:orderId'),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPaymentProof", null);
exports.PaymentController = PaymentController = __decorate([
    (0, common_1.Controller)('payment'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map