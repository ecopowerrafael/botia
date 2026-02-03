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
exports.OnboardingController = void 0;
const common_1 = require("@nestjs/common");
const onboarding_service_1 = require("./onboarding.service");
const onboarding_dto_1 = require("./dto/onboarding.dto");
let OnboardingController = class OnboardingController {
    onboardingService;
    constructor(onboardingService) {
        this.onboardingService = onboardingService;
    }
    async sendOnboardingEmail(dto) {
        return this.onboardingService.sendOnboardingEmail(dto);
    }
    async getStatus(token) {
        return this.onboardingService.getOnboardingStatus(token);
    }
    async completeOnboarding(dto) {
        return this.onboardingService.completeOnboarding(dto);
    }
    async validateToken(token) {
        return this.onboardingService.validateSetupToken(token);
    }
};
exports.OnboardingController = OnboardingController;
__decorate([
    (0, common_1.Post)('send-email'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [onboarding_dto_1.SendOnboardingEmailDto]),
    __metadata("design:returntype", Promise)
], OnboardingController.prototype, "sendOnboardingEmail", null);
__decorate([
    (0, common_1.Get)('status/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OnboardingController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('complete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [onboarding_dto_1.OnboardingSetupDto]),
    __metadata("design:returntype", Promise)
], OnboardingController.prototype, "completeOnboarding", null);
__decorate([
    (0, common_1.Get)('validate/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OnboardingController.prototype, "validateToken", null);
exports.OnboardingController = OnboardingController = __decorate([
    (0, common_1.Controller)('onboarding'),
    __metadata("design:paramtypes", [onboarding_service_1.OnboardingService])
], OnboardingController);
//# sourceMappingURL=onboarding.controller.js.map