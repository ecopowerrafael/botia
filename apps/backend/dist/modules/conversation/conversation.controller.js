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
exports.ConversationController = void 0;
const common_1 = require("@nestjs/common");
const conversation_service_1 = require("./conversation.service");
const conversation_dto_1 = require("./conversation.dto");
let ConversationController = class ConversationController {
    conversationService;
    constructor(conversationService) {
        this.conversationService = conversationService;
    }
    async processConversation(dto) {
        return await this.conversationService.processConversation(dto);
    }
    async getConversationHistory(dto) {
        return await this.conversationService.getConversationHistory(dto);
    }
    async getConversationContext(dto) {
        return await this.conversationService.getConversationContext(dto);
    }
    async clearConversationHistory(dto) {
        return await this.conversationService.clearConversationHistory(dto);
    }
    async getHistoryByChat(chatId) {
        return await this.conversationService.getConversationHistory({
            chatId,
            limit: 50,
            offset: 0,
        });
    }
};
exports.ConversationController = ConversationController;
__decorate([
    (0, common_1.Post)('process'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [conversation_dto_1.ProcessConversationDto]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "processConversation", null);
__decorate([
    (0, common_1.Post)('history'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [conversation_dto_1.GetConversationHistoryDto]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "getConversationHistory", null);
__decorate([
    (0, common_1.Post)('context'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [conversation_dto_1.GetConversationContextDto]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "getConversationContext", null);
__decorate([
    (0, common_1.Post)('clear-history'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [conversation_dto_1.ClearConversationHistoryDto]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "clearConversationHistory", null);
__decorate([
    (0, common_1.Get)('history/:chatId'),
    __param(0, (0, common_1.Param)('chatId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "getHistoryByChat", null);
exports.ConversationController = ConversationController = __decorate([
    (0, common_1.Controller)('conversation'),
    __metadata("design:paramtypes", [conversation_service_1.ConversationService])
], ConversationController);
//# sourceMappingURL=conversation.controller.js.map