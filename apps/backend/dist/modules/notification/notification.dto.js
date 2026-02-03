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
exports.VendorResponseWebhookResponseDto = exports.VendorResponseWebhookDto = exports.GetVendorConfigDto = exports.VendorWhatsAppConfigResponseDto = exports.VendorWhatsAppConfigDto = exports.NotificationSentResponseDto = exports.NotifyClientOrderStatusDto = exports.NotifyVendorPaymentApprovedDto = void 0;
const class_validator_1 = require("class-validator");
class NotifyVendorPaymentApprovedDto {
    orderId;
    tenantId;
    clientPhoneNumber;
    paymentProofUrl;
    paymentProofType;
    orderTotal;
    orderItems;
}
exports.NotifyVendorPaymentApprovedDto = NotifyVendorPaymentApprovedDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotifyVendorPaymentApprovedDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotifyVendorPaymentApprovedDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotifyVendorPaymentApprovedDto.prototype, "clientPhoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotifyVendorPaymentApprovedDto.prototype, "paymentProofUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], NotifyVendorPaymentApprovedDto.prototype, "paymentProofType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], NotifyVendorPaymentApprovedDto.prototype, "orderTotal", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], NotifyVendorPaymentApprovedDto.prototype, "orderItems", void 0);
class NotifyClientOrderStatusDto {
    orderId;
    clientPhoneNumber;
    status;
    reason;
}
exports.NotifyClientOrderStatusDto = NotifyClientOrderStatusDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotifyClientOrderStatusDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotifyClientOrderStatusDto.prototype, "clientPhoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotifyClientOrderStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], NotifyClientOrderStatusDto.prototype, "reason", void 0);
class NotificationSentResponseDto {
    success;
    messageId;
    status;
    error;
    timestamp;
}
exports.NotificationSentResponseDto = NotificationSentResponseDto;
class VendorWhatsAppConfigDto {
    tenantId;
    vendorWhatsAppNumber;
    vendorWhatsAppName;
    vendorInstanceKey;
}
exports.VendorWhatsAppConfigDto = VendorWhatsAppConfigDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VendorWhatsAppConfigDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VendorWhatsAppConfigDto.prototype, "vendorWhatsAppNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], VendorWhatsAppConfigDto.prototype, "vendorWhatsAppName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], VendorWhatsAppConfigDto.prototype, "vendorInstanceKey", void 0);
class VendorWhatsAppConfigResponseDto {
    success;
    config;
}
exports.VendorWhatsAppConfigResponseDto = VendorWhatsAppConfigResponseDto;
class GetVendorConfigDto {
    tenantId;
}
exports.GetVendorConfigDto = GetVendorConfigDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetVendorConfigDto.prototype, "tenantId", void 0);
class VendorResponseWebhookDto {
    orderId;
    vendorPhoneNumber;
    response;
    responseTime;
    reason;
}
exports.VendorResponseWebhookDto = VendorResponseWebhookDto;
class VendorResponseWebhookResponseDto {
    success;
    orderId;
    orderStatus;
    message;
    timestamp;
}
exports.VendorResponseWebhookResponseDto = VendorResponseWebhookResponseDto;
//# sourceMappingURL=notification.dto.js.map