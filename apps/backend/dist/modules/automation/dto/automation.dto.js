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
exports.PersonalizedMessage = exports.GetCampaignStatsDto = exports.UpdateCampaignStatusDto = exports.CreateMassCampaignDto = exports.CreateDripCampaignDto = exports.DripStep = exports.CampaignStatus = exports.CampaignType = void 0;
const class_validator_1 = require("class-validator");
var CampaignType;
(function (CampaignType) {
    CampaignType["DRIP"] = "drip";
    CampaignType["MASS"] = "mass";
})(CampaignType || (exports.CampaignType = CampaignType = {}));
var CampaignStatus;
(function (CampaignStatus) {
    CampaignStatus["DRAFT"] = "draft";
    CampaignStatus["ACTIVE"] = "active";
    CampaignStatus["PAUSED"] = "paused";
    CampaignStatus["COMPLETED"] = "completed";
    CampaignStatus["FAILED"] = "failed";
})(CampaignStatus || (exports.CampaignStatus = CampaignStatus = {}));
class DripStep {
    delay;
    message;
    mediaUrl;
}
exports.DripStep = DripStep;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], DripStep.prototype, "delay", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DripStep.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DripStep.prototype, "mediaUrl", void 0);
class CreateDripCampaignDto {
    tenantId;
    name;
    description;
    instanceKey;
    steps;
    contactId;
    contactPhones;
    startDate;
    repeat;
}
exports.CreateDripCampaignDto = CreateDripCampaignDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDripCampaignDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDripCampaignDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDripCampaignDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDripCampaignDto.prototype, "instanceKey", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateDripCampaignDto.prototype, "steps", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDripCampaignDto.prototype, "contactId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateDripCampaignDto.prototype, "contactPhones", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDripCampaignDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateDripCampaignDto.prototype, "repeat", void 0);
class CreateMassCampaignDto {
    tenantId;
    name;
    description;
    instanceKey;
    message;
    mediaUrl;
    contactPhones;
    delayBetweenMessages;
    randomDelayMax;
    variables;
}
exports.CreateMassCampaignDto = CreateMassCampaignDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMassCampaignDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMassCampaignDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMassCampaignDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMassCampaignDto.prototype, "instanceKey", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMassCampaignDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMassCampaignDto.prototype, "mediaUrl", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateMassCampaignDto.prototype, "contactPhones", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMassCampaignDto.prototype, "delayBetweenMessages", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMassCampaignDto.prototype, "randomDelayMax", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateMassCampaignDto.prototype, "variables", void 0);
class UpdateCampaignStatusDto {
    campaignId;
    status;
}
exports.UpdateCampaignStatusDto = UpdateCampaignStatusDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCampaignStatusDto.prototype, "campaignId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(CampaignStatus),
    __metadata("design:type", String)
], UpdateCampaignStatusDto.prototype, "status", void 0);
class GetCampaignStatsDto {
    campaignId;
    tenantId;
}
exports.GetCampaignStatsDto = GetCampaignStatsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetCampaignStatsDto.prototype, "campaignId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetCampaignStatsDto.prototype, "tenantId", void 0);
class PersonalizedMessage {
    phoneNumber;
    message;
    variables;
}
exports.PersonalizedMessage = PersonalizedMessage;
//# sourceMappingURL=automation.dto.js.map