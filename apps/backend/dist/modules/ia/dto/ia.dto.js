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
exports.SearchProductsDto = exports.ProcessMessageDto = exports.AIProvider = void 0;
const class_validator_1 = require("class-validator");
var AIProvider;
(function (AIProvider) {
    AIProvider["OPENAI"] = "openai";
    AIProvider["GEMINI"] = "gemini";
    AIProvider["OLLAMA"] = "ollama";
})(AIProvider || (exports.AIProvider = AIProvider = {}));
class ProcessMessageDto {
    tenantId;
    chatId;
    userMessage;
    provider;
    systemPrompt;
    conversationHistory;
}
exports.ProcessMessageDto = ProcessMessageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessMessageDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessMessageDto.prototype, "chatId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessMessageDto.prototype, "userMessage", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(AIProvider),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessMessageDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessMessageDto.prototype, "systemPrompt", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ProcessMessageDto.prototype, "conversationHistory", void 0);
class SearchProductsDto {
    tenantId;
    query;
    category;
    limit;
}
exports.SearchProductsDto = SearchProductsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "query", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SearchProductsDto.prototype, "limit", void 0);
//# sourceMappingURL=ia.dto.js.map