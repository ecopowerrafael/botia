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
exports.TTSController = void 0;
const common_1 = require("@nestjs/common");
const tts_service_1 = require("./tts.service");
const tts_dto_1 = require("./tts.dto");
let TTSController = class TTSController {
    ttsService;
    constructor(ttsService) {
        this.ttsService = ttsService;
    }
    async generateTTS(dto) {
        return await this.ttsService.generateTTS(dto);
    }
    async getCachedTTS(dto) {
        return { error: 'Cache lookup endpoint not available' };
    }
    async listCache() {
        return await this.ttsService.listCache();
    }
    async getStatus() {
        return await this.ttsService.getStatus();
    }
    async processAndRespond(dto) {
        return await this.ttsService.processAndRespond(dto);
    }
    async cleanupCache() {
        const removed = await this.ttsService.cleanupExpiredCache();
        return {
            removed,
            message: `${removed} itens de cache expirado removidos`,
        };
    }
};
exports.TTSController = TTSController;
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tts_dto_1.GenerateTTSDto]),
    __metadata("design:returntype", Promise)
], TTSController.prototype, "generateTTS", null);
__decorate([
    (0, common_1.Post)('cached'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tts_dto_1.GetCachedTTSDto]),
    __metadata("design:returntype", Promise)
], TTSController.prototype, "getCachedTTS", null);
__decorate([
    (0, common_1.Get)('cache/list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TTSController.prototype, "listCache", null);
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TTSController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('process-and-respond'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tts_dto_1.ProcessAndRespondDto]),
    __metadata("design:returntype", Promise)
], TTSController.prototype, "processAndRespond", null);
__decorate([
    (0, common_1.Get)('cleanup-cache'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TTSController.prototype, "cleanupCache", null);
exports.TTSController = TTSController = __decorate([
    (0, common_1.Controller)('tts'),
    __metadata("design:paramtypes", [tts_service_1.TTSService])
], TTSController);
//# sourceMappingURL=tts.controller.js.map