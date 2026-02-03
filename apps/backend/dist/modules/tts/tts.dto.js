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
exports.ProcessAndRespondResponseDto = exports.ProcessAndRespondDto = exports.AVAILABLE_VOICES = exports.TTSStatusResponseDto = exports.CacheItemDto = exports.ListCacheResponseDto = exports.GenerateTTSResponseDto = exports.GetCachedTTSDto = exports.GenerateTTSDto = void 0;
const class_validator_1 = require("class-validator");
class GenerateTTSDto {
    text;
    language;
    voice;
    speed;
    chatId;
}
exports.GenerateTTSDto = GenerateTTSDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateTTSDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GenerateTTSDto.prototype, "language", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GenerateTTSDto.prototype, "voice", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], GenerateTTSDto.prototype, "speed", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GenerateTTSDto.prototype, "chatId", void 0);
class GetCachedTTSDto {
    text;
    language;
}
exports.GetCachedTTSDto = GetCachedTTSDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetCachedTTSDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetCachedTTSDto.prototype, "language", void 0);
class GenerateTTSResponseDto {
    success;
    audioUrl;
    audioBase64;
    audioFormat;
    durationSeconds;
    text;
    language;
    cacheHit;
    model;
    processingTimeMs;
    message;
}
exports.GenerateTTSResponseDto = GenerateTTSResponseDto;
class ListCacheResponseDto {
    total;
    cached;
}
exports.ListCacheResponseDto = ListCacheResponseDto;
class CacheItemDto {
    id;
    text;
    language;
    audioUrl;
    createdAt;
    expiresAt;
    hitCount;
}
exports.CacheItemDto = CacheItemDto;
class TTSStatusResponseDto {
    ollamaHealthy;
    ttsModelAvailable;
    ttsModel;
    cacheStats;
}
exports.TTSStatusResponseDto = TTSStatusResponseDto;
exports.AVAILABLE_VOICES = [
    {
        id: 'pt-br-male',
        name: 'Portuguese Brazil - Male',
        language: 'pt',
        gender: 'male',
        quality: 'high',
    },
    {
        id: 'pt-br-female',
        name: 'Portuguese Brazil - Female',
        language: 'pt',
        gender: 'female',
        quality: 'high',
    },
    {
        id: 'pt-pt-male',
        name: 'Portuguese Portugal - Male',
        language: 'pt',
        gender: 'male',
        quality: 'high',
    },
    {
        id: 'en-us-male',
        name: 'English US - Male',
        language: 'en',
        gender: 'male',
        quality: 'high',
    },
    {
        id: 'en-us-female',
        name: 'English US - Female',
        language: 'en',
        gender: 'female',
        quality: 'high',
    },
    {
        id: 'es-male',
        name: 'Spanish - Male',
        language: 'es',
        gender: 'male',
        quality: 'high',
    },
];
class ProcessAndRespondDto {
    transcript;
    chatId;
    intent;
    cartItems;
    responseText;
    voice;
}
exports.ProcessAndRespondDto = ProcessAndRespondDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessAndRespondDto.prototype, "transcript", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessAndRespondDto.prototype, "chatId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessAndRespondDto.prototype, "intent", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ProcessAndRespondDto.prototype, "cartItems", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessAndRespondDto.prototype, "responseText", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessAndRespondDto.prototype, "voice", void 0);
class ProcessAndRespondResponseDto {
    transcript;
    intent;
    responseText;
    responseAudioUrl;
    responseAudioDuration;
    cartItemsAdded;
    nextStep;
    message;
}
exports.ProcessAndRespondResponseDto = ProcessAndRespondResponseDto;
//# sourceMappingURL=tts.dto.js.map