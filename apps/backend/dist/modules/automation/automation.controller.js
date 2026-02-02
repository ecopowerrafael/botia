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
exports.AutomationController = void 0;
const common_1 = require("@nestjs/common");
const automation_service_1 = require("./automation.service");
const automation_dto_1 = require("./dto/automation.dto");
let AutomationController = class AutomationController {
    automationService;
    constructor(automationService) {
        this.automationService = automationService;
    }
    async createDripCampaign(dto) {
        return this.automationService.createDripCampaign(dto);
    }
    async createMassCampaign(dto) {
        return this.automationService.createMassCampaign(dto);
    }
    async listCampaigns(tenantId, type, status) {
        if (!tenantId) {
            throw new common_1.HttpException('tenantId is required', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.automationService.listCampaigns(tenantId, type, status);
    }
    async getCampaign(campaignId, tenantId) {
        if (!tenantId) {
            throw new common_1.HttpException('tenantId is required', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.automationService.getCampaign(campaignId, tenantId);
    }
    async getCampaignStats(campaignId, tenantId) {
        if (!tenantId) {
            throw new common_1.HttpException('tenantId is required', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.automationService.getCampaignStats(campaignId, tenantId);
    }
    async pauseCampaign(campaignId) {
        return this.automationService.pauseCampaign(campaignId);
    }
    async resumeCampaign(campaignId) {
        return this.automationService.resumeCampaign(campaignId);
    }
    async deleteCampaign(campaignId) {
        return this.automationService.deleteCampaign(campaignId);
    }
};
exports.AutomationController = AutomationController;
__decorate([
    (0, common_1.Post)('drip'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [automation_dto_1.CreateDripCampaignDto]),
    __metadata("design:returntype", Promise)
], AutomationController.prototype, "createDripCampaign", null);
__decorate([
    (0, common_1.Post)('mass'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [automation_dto_1.CreateMassCampaignDto]),
    __metadata("design:returntype", Promise)
], AutomationController.prototype, "createMassCampaign", null);
__decorate([
    (0, common_1.Get)('campaigns'),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AutomationController.prototype, "listCampaigns", null);
__decorate([
    (0, common_1.Get)('campaigns/:campaignId'),
    __param(0, (0, common_1.Param)('campaignId')),
    __param(1, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AutomationController.prototype, "getCampaign", null);
__decorate([
    (0, common_1.Get)('campaigns/:campaignId/stats'),
    __param(0, (0, common_1.Param)('campaignId')),
    __param(1, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AutomationController.prototype, "getCampaignStats", null);
__decorate([
    (0, common_1.Put)('campaigns/:campaignId/pause'),
    __param(0, (0, common_1.Param)('campaignId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AutomationController.prototype, "pauseCampaign", null);
__decorate([
    (0, common_1.Put)('campaigns/:campaignId/resume'),
    __param(0, (0, common_1.Param)('campaignId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AutomationController.prototype, "resumeCampaign", null);
__decorate([
    (0, common_1.Delete)('campaigns/:campaignId'),
    __param(0, (0, common_1.Param)('campaignId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AutomationController.prototype, "deleteCampaign", null);
exports.AutomationController = AutomationController = __decorate([
    (0, common_1.Controller)('automation'),
    __metadata("design:paramtypes", [automation_service_1.AutomationService])
], AutomationController);
//# sourceMappingURL=automation.controller.js.map