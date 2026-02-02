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
exports.WordPressController = void 0;
const common_1 = require("@nestjs/common");
const wordpress_service_1 = require("./wordpress.service");
let WordPressController = class WordPressController {
    wordPressService;
    constructor(wordPressService) {
        this.wordPressService = wordPressService;
    }
    async connectWordPress(dto) {
        if (!dto.tenantId) {
            throw new common_1.HttpException('tenantId is required', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.wordPressService.connectWordPress(dto.tenantId, dto);
    }
    async configureFields(integrationId, dto) {
        if (!dto.tenantId) {
            throw new common_1.HttpException('tenantId is required', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.wordPressService.configureFields(dto.tenantId, {
            ...dto,
            integrationId,
        });
    }
    async syncData(integrationId, dto) {
        if (!dto.tenantId) {
            throw new common_1.HttpException('tenantId is required', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.wordPressService.syncData(dto.tenantId, {
            ...dto,
            integrationId,
        });
    }
    async listIntegrations(tenantId) {
        if (!tenantId) {
            throw new common_1.HttpException('tenantId is required', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.wordPressService.listIntegrations(tenantId);
    }
    async getIntegration(integrationId, tenantId) {
        if (!tenantId) {
            throw new common_1.HttpException('tenantId is required', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.wordPressService.getIntegration(integrationId, tenantId);
    }
    async disableIntegration(integrationId, tenantId) {
        if (!tenantId) {
            throw new common_1.HttpException('tenantId is required', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.wordPressService.disableIntegration(integrationId, tenantId);
    }
};
exports.WordPressController = WordPressController;
__decorate([
    (0, common_1.Post)('connect'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WordPressController.prototype, "connectWordPress", null);
__decorate([
    (0, common_1.Post)(':integrationId/configure'),
    __param(0, (0, common_1.Param)('integrationId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WordPressController.prototype, "configureFields", null);
__decorate([
    (0, common_1.Post)(':integrationId/sync'),
    __param(0, (0, common_1.Param)('integrationId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WordPressController.prototype, "syncData", null);
__decorate([
    (0, common_1.Get)('integrations'),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WordPressController.prototype, "listIntegrations", null);
__decorate([
    (0, common_1.Get)(':integrationId'),
    __param(0, (0, common_1.Param)('integrationId')),
    __param(1, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WordPressController.prototype, "getIntegration", null);
__decorate([
    (0, common_1.Delete)(':integrationId'),
    __param(0, (0, common_1.Param)('integrationId')),
    __param(1, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WordPressController.prototype, "disableIntegration", null);
exports.WordPressController = WordPressController = __decorate([
    (0, common_1.Controller)('wordpress'),
    __metadata("design:paramtypes", [wordpress_service_1.WordPressService])
], WordPressController);
//# sourceMappingURL=wordpress.controller.js.map