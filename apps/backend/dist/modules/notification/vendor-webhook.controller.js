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
var VendorWebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorWebhookController = void 0;
const common_1 = require("@nestjs/common");
const notification_service_1 = require("./notification.service");
let VendorWebhookController = VendorWebhookController_1 = class VendorWebhookController {
    notificationService;
    logger = new common_1.Logger(VendorWebhookController_1.name);
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    async handleVendorResponse(payload) {
        try {
            this.logger.log('Webhook recebido do vendedor');
            const { data } = payload;
            if (!data || !data.messages || data.messages.length === 0) {
                return { success: false, message: 'Webhook inválido' };
            }
            const message = data.messages[0];
            const senderPhone = message.key?.remoteJid?.split('@')[0] || 'unknown';
            const buttonResponse = message.message?.buttonsResponseMessage?.selectedButtonId;
            if (!buttonResponse) {
                return {
                    success: false,
                    message: 'Não é uma resposta de botão',
                };
            }
            const parts = buttonResponse.split('_');
            const responseType = parts[0];
            const orderId = parts.slice(1).join('_');
            if (!orderId) {
                return {
                    success: false,
                    message: 'OrderId não encontrado',
                };
            }
            const response = await this.notificationService.processVendorResponse({
                orderId,
                vendorPhoneNumber: senderPhone,
                response: responseType === 'accept' ? 'ACCEPT' : 'REJECT',
                responseTime: new Date().toISOString(),
            });
            this.logger.log(`✓ Resposta do vendedor processada: ${orderId} = ${responseType}`);
            return response;
        }
        catch (error) {
            this.logger.error('Erro ao processar webhook:', error);
            return {
                success: false,
                message: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }
    async handleMessageStatus(payload) {
        try {
            const { data } = payload;
            const { messageId, status } = data;
            this.logger.log(`Status de mensagem atualizado: ${messageId} = ${status}`);
            return {
                success: true,
                message: 'Status atualizado',
            };
        }
        catch (error) {
            this.logger.error('Erro ao processar status:', error);
            return {
                success: false,
                message: error.message,
            };
        }
    }
};
exports.VendorWebhookController = VendorWebhookController;
__decorate([
    (0, common_1.Post)('response'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VendorWebhookController.prototype, "handleVendorResponse", null);
__decorate([
    (0, common_1.Post)('status'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VendorWebhookController.prototype, "handleMessageStatus", null);
exports.VendorWebhookController = VendorWebhookController = VendorWebhookController_1 = __decorate([
    (0, common_1.Controller)('webhook/vendor'),
    __metadata("design:paramtypes", [notification_service_1.NotificationService])
], VendorWebhookController);
//# sourceMappingURL=vendor-webhook.controller.js.map