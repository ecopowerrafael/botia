"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTSService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const prisma_service_1 = require("../../shared/prisma.service");
const crypto = __importStar(require("crypto"));
let TTSService = class TTSService {
    httpService;
    prisma;
    ollamaApiUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    constructor(httpService, prisma) {
        this.httpService = httpService;
        this.prisma = prisma;
    }
    async generateTTS(dto) {
        const { text, language = 'pt', voice = 'pt-br-female', speed = 1.0 } = dto;
        if (!text || text.trim().length === 0) {
            throw new common_1.BadRequestException('Texto não pode ser vazio');
        }
        if (text.length > 1000) {
            throw new common_1.BadRequestException('Texto muito longo (máx 1000 caracteres)');
        }
        const textHash = this.hashText(text, language, voice);
        const cached = await this.getCachedTTS(textHash);
        if (cached) {
            return {
                success: true,
                audioUrl: cached.audioUrl,
                audioFormat: 'ogg',
                durationSeconds: cached.duration || 0,
                text,
                language,
                cacheHit: true,
                model: 'piper',
                processingTimeMs: 0,
                message: 'Áudio gerado a partir do cache (7 dias)',
            };
        }
        const startTime = Date.now();
        let audioUrl;
        let durationSeconds = 0;
        try {
            const response = await this.callOllamaTTS(text, language, voice, speed);
            audioUrl = response.audioUrl;
            durationSeconds = response.duration || this.estimateDuration(text);
        }
        catch (error) {
            console.error('Erro ao gerar TTS com Ollama:', error);
            throw new common_1.BadRequestException('Falha ao gerar áudio: ' + error.message);
        }
        const processingTimeMs = Date.now() - startTime;
        try {
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await this.prisma.tTSCache.create({
                data: {
                    textHash,
                    originalText: text,
                    audioUrl,
                    audioFormat: 'ogg',
                    duration: durationSeconds,
                    language,
                    voice,
                    expiresAt,
                    hitCount: 1,
                },
            });
        }
        catch (error) {
            console.warn('Erro ao salvar cache TTS:', error);
        }
        return {
            success: true,
            audioUrl,
            audioFormat: 'ogg',
            durationSeconds,
            text,
            language,
            cacheHit: false,
            model: 'piper',
            processingTimeMs,
            message: 'Áudio gerado com sucesso',
        };
    }
    async listCache() {
        const items = await this.prisma.tTSCache.findMany({
            where: {
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return {
            total: items.length,
            cached: items.map((item) => ({
                id: item.id,
                text: item.originalText,
                language: item.language,
                audioUrl: item.audioUrl,
                createdAt: item.createdAt.toISOString(),
                expiresAt: item.expiresAt.toISOString(),
                hitCount: item.hitCount,
            })),
        };
    }
    async getStatus() {
        let ollamaHealthy = false;
        let ttsModelAvailable = false;
        try {
            const response = await this.httpService.axiosRef.get(`${this.ollamaApiUrl}/api/tags`, { timeout: 5000 });
            ollamaHealthy = true;
            const models = response.data.models || [];
            ttsModelAvailable = models.some((m) => m.name && m.name.includes('piper'));
        }
        catch (error) {
            console.warn('Ollama não está saudável:', error.message);
        }
        const cacheItems = await this.prisma.tTSCache.findMany({
            where: {
                expiresAt: { gt: new Date() },
            },
        });
        const oldestDate = cacheItems.length > 0 ? cacheItems[0].createdAt : null;
        const newestDate = cacheItems.length > 0
            ? cacheItems[cacheItems.length - 1].createdAt
            : null;
        return {
            ollamaHealthy,
            ttsModelAvailable,
            ttsModel: 'piper',
            cacheStats: {
                totalCached: cacheItems.length,
                diskUsageMB: 0,
                oldestCacheDate: oldestDate?.toISOString() || 'N/A',
                newestCacheDate: newestDate?.toISOString() || 'N/A',
            },
        };
    }
    async processAndRespond(dto) {
        const { transcript, chatId, intent, responseText, voice } = dto;
        let responseAudioUrl;
        let responseAudioDuration;
        if (responseText) {
            try {
                const ttsResult = await this.generateTTS({
                    text: responseText,
                    language: 'pt',
                    voice: voice || 'pt-br-female',
                });
                responseAudioUrl = ttsResult.audioUrl;
                responseAudioDuration = ttsResult.durationSeconds;
            }
            catch (error) {
                console.warn('Erro ao gerar áudio de resposta:', error);
            }
        }
        return {
            transcript,
            intent: intent || 'PERGUNTA',
            responseText: responseText || 'Entendi sua mensagem!',
            responseAudioUrl,
            responseAudioDuration,
            cartItemsAdded: dto.cartItems,
            nextStep: this.suggestNextStep(intent, responseText || 'Entendi sua mensagem!'),
            message: 'Resposta processada com sucesso',
        };
    }
    async cleanupExpiredCache() {
        const result = await this.prisma.tTSCache.deleteMany({
            where: {
                expiresAt: { lte: new Date() },
            },
        });
        console.log(`Limpeza de TTS cache: ${result.count} itens removidos`);
        return result.count;
    }
    async callOllamaTTS(text, language, voice, speed) {
        try {
            const response = await this.httpService.axiosRef.post(`${this.ollamaApiUrl}/api/generate`, {
                model: 'piper',
                prompt: `Gere áudio em português com o texto: "${text}". Use voz ${voice} e velocidade ${speed}.`,
                stream: false,
            }, { timeout: 60000 });
            const audioUrl = this.extractAudioUrl(response.data.response) || 'audio.ogg';
            const duration = this.estimateDuration(text);
            return { audioUrl, duration };
        }
        catch (error) {
            console.error('Erro ao chamar Ollama TTS:', error.message);
            throw error;
        }
    }
    async getCachedTTS(textHash) {
        const cached = await this.prisma.tTSCache.findFirst({
            where: {
                textHash,
                expiresAt: { gt: new Date() },
            },
        });
        if (cached) {
            await this.prisma.tTSCache.update({
                where: { id: cached.id },
                data: { hitCount: { increment: 1 } },
            });
            return cached;
        }
        return null;
    }
    hashText(text, language, voice) {
        return crypto
            .createHash('sha256')
            .update(`${text}:${language}:${voice}`)
            .digest('hex');
    }
    estimateDuration(text) {
        return Math.ceil(text.length / 4);
    }
    extractAudioUrl(response) {
        try {
            const parsed = JSON.parse(response);
            return parsed.audioUrl || parsed.audio_url || null;
        }
        catch {
            return null;
        }
    }
    suggestNextStep(intent, responseText) {
        if (!intent) {
            return 'AGUARDAR_ENTRADA';
        }
        switch (intent) {
            case 'COMPRA':
                return 'MOSTRAR_CARRINHO';
            case 'PERGUNTA':
            case 'CARDAPIO':
                return 'AGUARDAR_ENTRADA';
            case 'CANCELAR_PEDIDO':
                return 'PEDIR_CONFIRMACAO';
            case 'RECLAMACAO':
                return 'ESCALAR_SUPORTE';
            default:
                return 'AGUARDAR_ENTRADA';
        }
    }
};
exports.TTSService = TTSService;
exports.TTSService = TTSService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        prisma_service_1.PrismaService])
], TTSService);
//# sourceMappingURL=tts.service.js.map