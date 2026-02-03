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
exports.IAIntegrationController = void 0;
const common_1 = require("@nestjs/common");
const ia_integration_service_1 = require("./ia-integration.service");
const ia_integration_dto_1 = require("./ia-integration.dto");
let IAIntegrationController = class IAIntegrationController {
    iaIntegrationService;
    constructor(iaIntegrationService) {
        this.iaIntegrationService = iaIntegrationService;
    }
    async processConversationWithAI(dto) {
        return await this.iaIntegrationService.processConversationWithAI(dto);
    }
    async multiTurnConversation(dto) {
        return await this.iaIntegrationService.multiTurnConversation(dto);
    }
};
exports.IAIntegrationController = IAIntegrationController;
__decorate([
    (0, common_1.Post)('process-with-ai'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ia_integration_dto_1.ProcessConversationWithAIDto]),
    __metadata("design:returntype", Promise)
], IAIntegrationController.prototype, "processConversationWithAI", null);
__decorate([
    (0, common_1.Post)('multi-turn'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ia_integration_dto_1.MultiTurnConversationDto]),
    __metadata("design:returntype", Promise)
], IAIntegrationController.prototype, "multiTurnConversation", null);
exports.IAIntegrationController = IAIntegrationController = __decorate([
    (0, common_1.Controller)('ia/integration'),
    __metadata("design:paramtypes", [ia_integration_service_1.IAIntegrationService])
], IAIntegrationController);
//# sourceMappingURL=ia-integration.controller.js.map