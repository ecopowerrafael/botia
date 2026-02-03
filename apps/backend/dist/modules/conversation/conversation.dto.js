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
exports.ClearConversationHistoryDto = exports.ConversationContextDto = exports.GetConversationContextDto = exports.GetConversationHistoryResponseDto = exports.ConversationMessageDto = exports.GetConversationHistoryDto = exports.ProcessConversationResponseDto = exports.ProcessConversationDto = void 0;
const class_validator_1 = require("class-validator");
class ProcessConversationDto {
    audioMessageId;
    transcript;
    chatId;
    context;
    voice;
}
exports.ProcessConversationDto = ProcessConversationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessConversationDto.prototype, "audioMessageId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessConversationDto.prototype, "transcript", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessConversationDto.prototype, "chatId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessConversationDto.prototype, "context", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessConversationDto.prototype, "voice", void 0);
class ProcessConversationResponseDto {
    audioMessageId;
    transcript;
    intent;
    intentConfidence;
    entities;
    responseText;
    responseAudioUrl;
    responseAudioDuration;
    cartItemsAdded;
    cartTotal;
    nextStep;
    suggestions;
    timestamp;
    processingTimeMs;
    message;
}
exports.ProcessConversationResponseDto = ProcessConversationResponseDto;
class GetConversationHistoryDto {
    chatId;
    limit;
    offset;
}
exports.GetConversationHistoryDto = GetConversationHistoryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetConversationHistoryDto.prototype, "chatId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], GetConversationHistoryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], GetConversationHistoryDto.prototype, "offset", void 0);
class ConversationMessageDto {
    id;
    timestamp;
    type;
    content;
    audioUrl;
    intent;
    entities;
}
exports.ConversationMessageDto = ConversationMessageDto;
class GetConversationHistoryResponseDto {
    chatId;
    messages;
    totalMessages;
    limit;
    offset;
}
exports.GetConversationHistoryResponseDto = GetConversationHistoryResponseDto;
class GetConversationContextDto {
    chatId;
}
exports.GetConversationContextDto = GetConversationContextDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetConversationContextDto.prototype, "chatId", void 0);
class ConversationContextDto {
    chatId;
    totalMessages;
    lastMessageTime;
    cartStatus;
    recentIntents;
    userPreferences;
    suggestedNextActions;
}
exports.ConversationContextDto = ConversationContextDto;
class ClearConversationHistoryDto {
    chatId;
    beforeDate;
}
exports.ClearConversationHistoryDto = ClearConversationHistoryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ClearConversationHistoryDto.prototype, "chatId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ClearConversationHistoryDto.prototype, "beforeDate", void 0);
//# sourceMappingURL=conversation.dto.js.map