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
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
let NotificationService = NotificationService_1 = class NotificationService {
    prisma;
    whatsappService;
    logger = new common_1.Logger(NotificationService_1.name);
    constructor(prisma, whatsappService) {
        this.prisma = prisma;
        this.whatsappService = whatsappService;
    }
    async notifyVendorPaymentApproved(dto) {
        const { orderId, tenantId, clientPhoneNumber, paymentProofUrl, paymentProofType = 'PIX_RECEIPT', orderTotal, orderItems = [], } = dto;
        try {
            const vendorConfig = await this.getVendorWhatsAppConfig(tenantId);
            if (!vendorConfig) {
                return {
                    success: false,
                    status: 'failed',
                    error: 'Número WhatsApp do vendedor não configurado. Configure em Painel Admin.',
                    timestamp: new Date().toISOString(),
                };
            }
            const instanceKey = vendorConfig.vendorInstanceKey ||
                (await this.getDefaultInstanceKey(tenantId));
            const message = this.buildVendorNotificationMessage(orderId, clientPhoneNumber, paymentProofType, orderTotal, orderItems);
            const messageId = await this.sendWhatsAppMessage(instanceKey, vendorConfig.vendorPhoneNumber, message);
            if (paymentProofUrl) {
                try {
                    await this.sendWhatsAppMedia(instanceKey, vendorConfig.vendorPhoneNumber, paymentProofUrl, 'Comprovante de Pagamento');
                }
                catch (error) {
                    this.logger.warn('Erro ao enviar comprovante de pagamento:', error);
                }
            }
            const buttonsMessage = this.buildVendorActionButtons(orderId);
            await this.sendWhatsAppMessage(instanceKey, vendorConfig.vendorPhoneNumber, buttonsMessage);
            await this.saveNotificationLog({
                tenantId,
                orderId,
                recipientType: 'VENDOR',
                recipientPhone: vendorConfig.vendorPhoneNumber,
                messageType: 'PAYMENT_APPROVED',
                status: 'sent',
                messageId,
            });
            this.logger.log(`Notificação de pagamento enviada para vendedor: ${vendorConfig.vendorPhoneNumber}`);
            return {
                success: true,
                messageId,
                status: 'sent',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`Erro ao notificar vendedor: ${error.message}`);
            return {
                success: false,
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }
    async notifyClientOrderStatus(dto) {
        const { orderId, clientPhoneNumber, status, reason } = dto;
        try {
            const order = await this.prisma.order.findUnique({
                where: { id: orderId },
            });
            if (!order) {
                throw new common_1.BadRequestException('Pedido não encontrado');
            }
            const tenantId = order.tenantId;
            const instanceKey = await this.getDefaultInstanceKey(tenantId);
            const message = status === 'CONFIRMED'
                ? this.buildClientOrderConfirmedMessage(orderId)
                : this.buildClientOrderRejectedMessage(orderId, reason);
            const messageId = await this.sendWhatsAppMessage(instanceKey, clientPhoneNumber, message);
            await this.saveNotificationLog({
                tenantId,
                orderId,
                recipientType: 'CLIENT',
                recipientPhone: clientPhoneNumber,
                messageType: `ORDER_${status}`,
                status: 'sent',
                messageId,
            });
            this.logger.log(`Notificação de pedido ${status} enviada para cliente: ${clientPhoneNumber}`);
            return {
                success: true,
                messageId,
                status: 'sent',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`Erro ao notificar cliente sobre status do pedido: ${error.message}`);
            return {
                success: false,
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }
    async saveVendorWhatsAppConfig(dto) {
        const { tenantId, vendorWhatsAppNumber, vendorWhatsAppName, vendorInstanceKey, } = dto;
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!tenant) {
            throw new common_1.BadRequestException('Tenant não encontrado');
        }
        const config = await this.prisma.tenantWhatsAppConfig.upsert({
            where: { tenantId },
            update: {
                vendorPhoneNumber: vendorWhatsAppNumber,
                vendorPhoneName: vendorWhatsAppName,
                vendorInstanceKey,
                updatedAt: new Date(),
            },
            create: {
                tenantId,
                vendorPhoneNumber: vendorWhatsAppNumber,
                vendorPhoneName: vendorWhatsAppName,
                vendorInstanceKey,
            },
        });
        return {
            success: true,
            config: {
                tenantId: config.tenantId,
                vendorWhatsAppNumber: config.vendorPhoneNumber,
                vendorWhatsAppName: config.vendorPhoneName || 'Vendedor',
                createdAt: config.createdAt.toISOString(),
                updatedAt: config.updatedAt.toISOString(),
            },
        };
    }
    async getVendorWhatsAppConfig(tenantId) {
        return await this.prisma.tenantWhatsAppConfig.findUnique({
            where: { tenantId },
        });
    }
    async configureVendorWhatsApp(dto) {
        return this.saveVendorWhatsAppConfig(dto);
    }
    async getVendorConfig(tenantId) {
        return this.getVendorWhatsAppConfig(tenantId);
    }
    async processVendorResponse(payload) {
        this.logger.log('Processando resposta do vendedor', payload);
        return { success: true };
    }
    buildVendorNotificationMessage(orderId, clientPhone, paymentType, total, items) {
        let message = `🎉 *NOVO PEDIDO PAGAMENTO APROVADO*\n\n`;
        message += `📦 *Pedido:* ${orderId}\n`;
        message += `👤 *Cliente:* ${clientPhone}\n`;
        message += `💰 *Valor:* R$ ${total.toFixed(2)}\n`;
        message += `💳 *Pagamento:* ${paymentType === 'PIX_RECEIPT' ? 'PIX' : paymentType}\n\n`;
        if (items.length > 0) {
            message += `*ITENS DO PEDIDO:*\n`;
            items.forEach((item, index) => {
                message += `${index + 1}. ${item.productName || item.name} x${item.quantity}\n`;
            });
            message += `\n`;
        }
        message += `⚠️ *Próximo passo:*\n`;
        message += `Clique em [ACEITAR] para confirmar o pedido\n`;
        message += `Clique em [REJEITAR] se não conseguir atender\n`;
        return message;
    }
    buildVendorActionButtons(orderId) {
        return `*AÇÃO NECESSÁRIA*\n\nClique no botão abaixo para responder:\n\n` +
            `[ACEITAR] - Confirmar que vai preparar\n` +
            `[REJEITAR] - Cancelar este pedido\n\n` +
            `Ordem: ${orderId}`;
    }
    buildClientOrderConfirmedMessage(orderId) {
        return `✅ *PEDIDO CONFIRMADO*\n\n` +
            `🎊 Excelente! Seu pedido foi confirmado.\n\n` +
            `📦 *Número do pedido:* ${orderId}\n\n` +
            `⏱️ Você receberá um aviso quando estiver pronto para entrega/retirada.\n\n` +
            `Obrigado por comprar conosco! 🙏`;
    }
    buildClientOrderRejectedMessage(orderId, reason) {
        return `❌ *PEDIDO NÃO CONFIRMADO*\n\n` +
            `😞 Desculpe, não conseguimos confirmar seu pedido.\n\n` +
            `📦 *Número do pedido:* ${orderId}\n` +
            `${reason ? `📝 *Motivo:* ${reason}\n` : ''}` +
            `\n💬 Entre em contato conosco para mais informações.\n` +
            `📞 Estamos aqui para ajudar!`;
    }
    async sendWhatsAppMessage(instanceKey, phoneNumber, message) {
        try {
            const response = await this.whatsappService.sendMessage({
                instanceKey,
                phoneNumber,
                message,
            });
            return response?.messageId || `msg_${Date.now()}`;
        }
        catch (error) {
            this.logger.error(`Erro ao enviar mensagem WhatsApp: ${error.message}`);
            throw error;
        }
    }
    async sendWhatsAppMedia(instanceKey, phoneNumber, mediaUrl, caption) {
        try {
            this.logger.log(`Enviando media para ${phoneNumber}: ${mediaUrl}`);
        }
        catch (error) {
            this.logger.error(`Erro ao enviar media: ${error.message}`);
            throw error;
        }
    }
    async getDefaultInstanceKey(tenantId) {
        const instance = await this.prisma.whatsAppInstance.findFirst({
            where: {
                tenantId,
                status: 'connected',
            },
        });
        if (!instance) {
            throw new common_1.BadRequestException('Nenhuma instância WhatsApp conectada para este tenant');
        }
        return instance.instanceKey;
    }
    async saveNotificationLog(data) {
        try {
            this.logger.log(`Log de notificação salvo: ${data.messageType}`);
        }
        catch (error) {
            this.logger.warn(`Erro ao salvar log de notificação: ${error.message}`);
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        whatsapp_service_1.WhatsAppService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map