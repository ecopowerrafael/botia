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
var WhatsAppController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppController = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_service_1 = require("./whatsapp.service");
const whatsapp_dto_1 = require("./dto/whatsapp.dto");
let WhatsAppController = WhatsAppController_1 = class WhatsAppController {
    whatsappService;
    logger = new common_1.Logger(WhatsAppController_1.name);
    constructor(whatsappService) {
        this.whatsappService = whatsappService;
    }
    async createInstance(dto) {
        return this.whatsappService.createInstance(dto);
    }
    async connectInstance(dto) {
        return this.whatsappService.connectInstance(dto);
    }
    async disconnectInstance(dto) {
        return this.whatsappService.disconnectInstance(dto);
    }
    async listInstances(tenantId) {
        return this.whatsappService.listInstances(tenantId);
    }
    async getInstance(tenantId, instanceKey) {
        return this.whatsappService.getInstance(tenantId, instanceKey);
    }
    async sendMessage(dto) {
        return this.whatsappService.sendMessage(dto);
    }
    async receiveWebhook(payload) {
        this.logger.log(`Webhook received: ${payload.event}`);
        await this.whatsappService.processWebhook(payload);
        return { success: true };
    }
};
exports.WhatsAppController = WhatsAppController;
__decorate([
    (0, common_1.Post)('instance/create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [whatsapp_dto_1.CreateInstanceDto]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "createInstance", null);
__decorate([
    (0, common_1.Post)('instance/connect'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [whatsapp_dto_1.ConnectInstanceDto]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "connectInstance", null);
__decorate([
    (0, common_1.Post)('instance/disconnect'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [whatsapp_dto_1.DisconnectInstanceDto]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "disconnectInstance", null);
__decorate([
    (0, common_1.Get)('instance/:tenantId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "listInstances", null);
__decorate([
    (0, common_1.Get)('instance/:tenantId/:instanceKey'),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Param)('instanceKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "getInstance", null);
__decorate([
    (0, common_1.Post)('message/send'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [whatsapp_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [whatsapp_dto_1.WebhookPayloadDto]),
    __metadata("design:returntype", Promise)
], WhatsAppController.prototype, "receiveWebhook", null);
exports.WhatsAppController = WhatsAppController = WhatsAppController_1 = __decorate([
    (0, common_1.Controller)('whatsapp'),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsAppService])
], WhatsAppController);
//# sourceMappingURL=whatsapp.controller.js.map