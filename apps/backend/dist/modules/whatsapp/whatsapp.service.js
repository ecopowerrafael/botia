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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var WhatsAppService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma.service");
const ia_service_1 = require("../ia/ia.service");
const axios_1 = __importDefault(require("axios"));
let WhatsAppService = WhatsAppService_1 = class WhatsAppService {
    prisma;
    iaService;
    logger = new common_1.Logger(WhatsAppService_1.name);
    evolutionApi;
    constructor(prisma, iaService) {
        this.prisma = prisma;
        this.iaService = iaService;
        this.evolutionApi = axios_1.default.create({
            baseURL: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    async createInstance(dto) {
        const { tenantId, name, description } = dto;
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!tenant) {
            throw new common_1.HttpException('Tenant not found', common_1.HttpStatus.NOT_FOUND);
        }
        const instanceKey = `${tenant.slug}_${Date.now()}`;
        try {
            const response = await this.evolutionApi.post('/instance/create', {
                instanceName: instanceKey,
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS',
            });
            const instance = await this.prisma.whatsAppInstance.create({
                data: {
                    tenantId,
                    name,
                    instanceKey,
                    status: 'pending_qr',
                },
            });
            this.logger.log(`WhatsApp instance created: ${instanceKey} for tenant ${tenantId}`);
            return {
                instance,
                qrcode: response.data.qrcode,
                instanceKey,
            };
        }
        catch (error) {
            this.logger.error(`Error creating WhatsApp instance: ${error.message}`);
            throw new common_1.HttpException('Failed to create WhatsApp instance', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async connectInstance(dto) {
        const { tenantId, instanceKey } = dto;
        const instance = await this.prisma.whatsAppInstance.findFirst({
            where: { tenantId, instanceKey },
        });
        if (!instance) {
            throw new common_1.HttpException('WhatsApp instance not found', common_1.HttpStatus.NOT_FOUND);
        }
        try {
            const response = await this.evolutionApi.get(`/instance/fetch/${instanceKey}`);
            if (response.data.instance?.state === 'open') {
                await this.prisma.whatsAppInstance.update({
                    where: { id: instance.id },
                    data: { status: 'connected' },
                });
                this.logger.log(`WhatsApp instance connected: ${instanceKey}`);
                return { status: 'connected', instance };
            }
            else {
                return { status: 'waiting_qr', message: 'Please scan QR code' };
            }
        }
        catch (error) {
            this.logger.error(`Error connecting instance: ${error.message}`);
            throw new common_1.HttpException('Failed to connect instance', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async disconnectInstance(dto) {
        const { tenantId, instanceKey } = dto;
        const instance = await this.prisma.whatsAppInstance.findFirst({
            where: { tenantId, instanceKey },
        });
        if (!instance) {
            throw new common_1.HttpException('WhatsApp instance not found', common_1.HttpStatus.NOT_FOUND);
        }
        try {
            await this.evolutionApi.post(`/instance/logout/${instanceKey}`);
            await this.prisma.whatsAppInstance.update({
                where: { id: instance.id },
                data: { status: 'disconnected' },
            });
            this.logger.log(`WhatsApp instance disconnected: ${instanceKey}`);
            return { status: 'disconnected' };
        }
        catch (error) {
            this.logger.error(`Error disconnecting instance: ${error.message}`);
            throw new common_1.HttpException('Failed to disconnect instance', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async sendMessage(dto) {
        const { tenantId, instanceKey, phoneNumber, message, mediaUrl } = dto;
        const instance = await this.prisma.whatsAppInstance.findFirst({
            where: { tenantId, instanceKey },
        });
        if (!instance) {
            throw new common_1.HttpException('WhatsApp instance not found', common_1.HttpStatus.NOT_FOUND);
        }
        if (instance.status !== 'connected') {
            throw new common_1.HttpException('WhatsApp instance not connected', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const response = await this.evolutionApi.post(`/message/sendText/${instanceKey}`, {
                number: phoneNumber,
                text: message,
            });
            const contact = await this.prisma.contact.upsert({
                where: { id: `${tenantId}_${phoneNumber}` },
                update: {},
                create: {
                    id: `${tenantId}_${phoneNumber}`,
                    tenantId,
                    name: phoneNumber,
                    phone: phoneNumber,
                },
            });
            const chat = await this.prisma.chat.upsert({
                where: { id: `${instanceKey}_${phoneNumber}` },
                update: {},
                create: {
                    id: `${instanceKey}_${phoneNumber}`,
                    whatsappId: instance.id,
                    contactId: contact.id,
                },
            });
            await this.prisma.message.create({
                data: {
                    chatId: chat.id,
                    sender: 'bot',
                    content: message,
                    type: 'BOT',
                },
            });
            this.logger.log(`Message sent to ${phoneNumber} via ${instanceKey}`);
            return {
                success: true,
                messageId: response.data.messageId,
            };
        }
        catch (error) {
            this.logger.error(`Error sending message: ${error.message}`);
            throw new common_1.HttpException('Failed to send message', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async processWebhook(payload) {
        const { event, instanceKey, from, to, message, data, status } = payload;
        this.logger.log(`Processing webhook event: ${event} from ${instanceKey}`);
        const instance = await this.prisma.whatsAppInstance.findFirst({
            where: { instanceKey },
        });
        if (!instance) {
            this.logger.warn(`Instance not found for key: ${instanceKey}`);
            return;
        }
        try {
            switch (event) {
                case 'message':
                    if (from && message) {
                        await this.handleIncomingMessage(instance, from, message, data);
                    }
                    break;
                case 'status':
                    if (to && status) {
                        await this.handleMessageStatus(instance, to, status);
                    }
                    break;
                case 'instance.connected':
                    await this.prisma.whatsAppInstance.update({
                        where: { id: instance.id },
                        data: { status: 'connected' },
                    });
                    this.logger.log(`Instance connected: ${instanceKey}`);
                    break;
                case 'instance.disconnected':
                    await this.prisma.whatsAppInstance.update({
                        where: { id: instance.id },
                        data: { status: 'disconnected' },
                    });
                    this.logger.log(`Instance disconnected: ${instanceKey}`);
                    break;
            }
        }
        catch (error) {
            this.logger.error(`Error processing webhook: ${error.message}`);
        }
    }
    async handleIncomingMessage(instance, from, message, data) {
        const contact = await this.prisma.contact.upsert({
            where: { id: `${instance.tenantId}_${from}` },
            update: {},
            create: {
                id: `${instance.tenantId}_${from}`,
                tenantId: instance.tenantId,
                name: from,
                phone: from,
            },
        });
        const chat = await this.prisma.chat.upsert({
            where: { id: `${instance.instanceKey}_${from}` },
            update: {},
            create: {
                id: `${instance.instanceKey}_${from}`,
                whatsappId: instance.id,
                contactId: contact.id,
            },
        });
        await this.prisma.message.create({
            data: {
                chatId: chat.id,
                sender: from,
                content: message,
                type: 'USER',
            },
        });
        const conversationHistory = await this.iaService.getConversationHistory(chat.id, 5);
        try {
            const result = await this.iaService.processMessage({
                tenantId: instance.tenantId,
                chatId: chat.id,
                userMessage: message,
            });
            await this.sendMessage({
                tenantId: instance.tenantId,
                instanceKey: instance.instanceKey,
                phoneNumber: from,
                message: result.response,
            });
            this.logger.log(`AI response sent to ${from} via ${instance.instanceKey}`);
        }
        catch (error) {
            this.logger.error(`Error processing message with AI: ${error.message}`);
            await this.sendMessage({
                tenantId: instance.tenantId,
                instanceKey: instance.instanceKey,
                phoneNumber: from,
                message: 'Desculpe, não consegui processar sua mensagem. Tente novamente.',
            });
        }
    }
    async handleMessageStatus(instance, to, status) {
        this.logger.log(`Message status updated: ${to} - ${status}`);
    }
    async listInstances(tenantId) {
        return this.prisma.whatsAppInstance.findMany({
            where: { tenantId },
        });
    }
    async getInstance(tenantId, instanceKey) {
        return this.prisma.whatsAppInstance.findFirst({
            where: { tenantId, instanceKey },
        });
    }
};
exports.WhatsAppService = WhatsAppService;
exports.WhatsAppService = WhatsAppService = WhatsAppService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ia_service_1.IAService])
], WhatsAppService);
//# sourceMappingURL=whatsapp.service.js.map