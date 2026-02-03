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
exports.NotificationController = void 0;
const common_1 = require("@nestjs/common");
const notification_service_1 = require("./notification.service");
const notification_dto_1 = require("./notification.dto");
let NotificationController = class NotificationController {
    notificationService;
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    async configureVendorWhatsApp(dto) {
        return await this.notificationService.configureVendorWhatsApp(dto);
    }
    async getVendorConfig(tenantId) {
        return await this.notificationService.getVendorConfig(tenantId);
    }
    async notifyVendorPaymentApproved(dto) {
        return await this.notificationService.notifyVendorPaymentApproved(dto);
    }
    async notifyClientOrderStatus(dto) {
        return await this.notificationService.notifyClientOrderStatus(dto);
    }
};
exports.NotificationController = NotificationController;
__decorate([
    (0, common_1.Post)('config/vendor'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_dto_1.VendorWhatsAppConfigDto]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "configureVendorWhatsApp", null);
__decorate([
    (0, common_1.Get)('config/:tenantId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getVendorConfig", null);
__decorate([
    (0, common_1.Post)('vendor/payment-approved'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_dto_1.NotifyVendorPaymentApprovedDto]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "notifyVendorPaymentApproved", null);
__decorate([
    (0, common_1.Post)('client/order-status'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_dto_1.NotifyClientOrderStatusDto]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "notifyClientOrderStatus", null);
exports.NotificationController = NotificationController = __decorate([
    (0, common_1.Controller)('notification'),
    __metadata("design:paramtypes", [notification_service_1.NotificationService])
], NotificationController);
//# sourceMappingURL=notification.controller.js.map