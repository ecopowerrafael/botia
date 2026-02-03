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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendOnboardingEmailDto = exports.OnboardingStatusDto = exports.OnboardingSetupDto = void 0;
const class_validator_1 = require("class-validator");
const enums_1 = require("../../../shared/enums");
class OnboardingSetupDto {
    setupToken;
    email;
    password;
    operationMode;
    timezone;
    audioLanguage;
}
exports.OnboardingSetupDto = OnboardingSetupDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardingSetupDto.prototype, "setupToken", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], OnboardingSetupDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], OnboardingSetupDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.VendorMode),
    __metadata("design:type", String)
], OnboardingSetupDto.prototype, "operationMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardingSetupDto.prototype, "timezone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OnboardingSetupDto.prototype, "audioLanguage", void 0);
class OnboardingStatusDto {
    setupTokenValid;
    step;
    userEmail;
    expiresAt;
}
exports.OnboardingStatusDto = OnboardingStatusDto;
class SendOnboardingEmailDto {
    email;
    tenantId;
}
exports.SendOnboardingEmailDto = SendOnboardingEmailDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SendOnboardingEmailDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendOnboardingEmailDto.prototype, "tenantId", void 0);
//# sourceMappingURL=onboarding.dto.js.map