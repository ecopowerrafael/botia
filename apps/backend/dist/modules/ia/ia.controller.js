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
exports.IAController = void 0;
const common_1 = require("@nestjs/common");
const ia_service_1 = require("./ia.service");
const ia_dto_1 = require("./dto/ia.dto");
let IAController = class IAController {
    iaService;
    constructor(iaService) {
        this.iaService = iaService;
    }
    async processMessage(dto) {
        return this.iaService.processMessage(dto);
    }
    async searchProducts(dto) {
        return this.iaService.searchProducts(dto);
    }
    async getConversationHistory(chatId) {
        return this.iaService.getConversationHistory(chatId);
    }
    async getTenantIAConfig(tenantId) {
        return this.iaService.getTenantIAConfig(tenantId);
    }
};
exports.IAController = IAController;
__decorate([
    (0, common_1.Post)('process-message'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ia_dto_1.ProcessMessageDto]),
    __metadata("design:returntype", Promise)
], IAController.prototype, "processMessage", null);
__decorate([
    (0, common_1.Post)('search-products'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ia_dto_1.SearchProductsDto]),
    __metadata("design:returntype", Promise)
], IAController.prototype, "searchProducts", null);
__decorate([
    (0, common_1.Get)('conversation/:chatId'),
    __param(0, (0, common_1.Param)('chatId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IAController.prototype, "getConversationHistory", null);
__decorate([
    (0, common_1.Get)('config/:tenantId'),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IAController.prototype, "getTenantIAConfig", null);
exports.IAController = IAController = __decorate([
    (0, common_1.Controller)('ia'),
    __metadata("design:paramtypes", [ia_service_1.IAService])
], IAController);
//# sourceMappingURL=ia.controller.js.map