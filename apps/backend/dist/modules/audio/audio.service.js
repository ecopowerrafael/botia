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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma.service");
const axios_1 = __importDefault(require("axios"));
let AudioService = class AudioService {
    prisma;
    ollamaApiUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    constructor(prisma) {
        this.prisma = prisma;
    }
    async receiveAudio(dto) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: dto.chatId },
        });
        if (!chat) {
            throw new common_1.BadRequestException('Chat não encontrado');
        }
        const audioMessage = await this.prisma.audioMessage.create({
            data: {
                chatId: dto.chatId,
                contactId: dto.contactId,
                audioPath: dto.audioPath,
                mimeType: dto.mimeType,
                sizeBytes: dto.sizeBytes,
                duration: dto.durationSeconds,
                status: 'RECEIVED',
            },
        });
        this.transcribeInBackground(audioMessage.id, dto.audioPath, dto.mimeType);
        return this.mapToResponseDto(audioMessage);
    }
    async transcribeAudio(dto) {
        const startTime = Date.now();
        const audioMessage = await this.prisma.audioMessage.findUnique({
            where: { id: dto.audioMessageId },
        });
        if (!audioMessage) {
            throw new common_1.BadRequestException('Áudio não encontrado');
        }
        await this.prisma.audioMessage.update({
            where: { id: dto.audioMessageId },
            data: { status: 'CONVERTING' },
        });
        try {
            const transcription = await this.callOllamaWhisper(dto.audioPath, dto.language || 'pt');
            const processingTime = Date.now() - startTime;
            await this.prisma.audioMessage.update({
                where: { id: dto.audioMessageId },
                data: {
                    status: 'TRANSCRIBED',
                    transcript: transcription.text,
                    transcriptConfidence: transcription.confidence,
                    transcribedAt: new Date(),
                    transcriptionTimeMs: processingTime,
                },
            });
            return {
                success: true,
                audioMessageId: dto.audioMessageId,
                transcript: transcription.text,
                confidence: transcription.confidence,
                language: dto.language || 'pt',
                duration: audioMessage.duration || 0,
                processTimeMs: processingTime,
            };
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            await this.prisma.audioMessage.update({
                where: { id: dto.audioMessageId },
                data: {
                    status: 'TRANSCRIPTION_FAILED',
                    errorMessage: error.message,
                    transcriptionTimeMs: processingTime,
                },
            });
            throw new common_1.HttpException(`Erro ao transcrever áudio: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async callOllamaWhisper(audioPath, language) {
        try {
            const response = await axios_1.default.post(`${this.ollamaApiUrl}/api/transcribe`, {
                model: 'whisper',
                audio: audioPath,
                language: language,
                response_format: 'json',
            }, { timeout: 60000 });
            return {
                text: response.data.text || '',
                confidence: response.data.confidence || 0.7,
            };
        }
        catch (error) {
            console.error('Erro ao chamar Ollama Whisper:', error.message);
            throw new common_1.HttpException('Erro ao processar áudio com IA', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async transcribeInBackground(audioMessageId, audioPath, mimeType) {
        setTimeout(async () => {
            try {
                await this.transcribeAudio({
                    audioMessageId,
                    audioPath,
                    mimeType,
                    language: 'pt',
                });
            }
            catch (error) {
                console.error('Erro em transcrição background:', error.message);
            }
        }, 1000);
    }
    async getAudioMessages(chatId, limit = 50) {
        const audioMessages = await this.prisma.audioMessage.findMany({
            where: { chatId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return {
            chatId,
            audioMessages: audioMessages.map((am) => this.mapToResponseDto(am)),
            totalCount: audioMessages.length,
            lastUpdated: new Date(),
        };
    }
    async getAudioMessage(audioMessageId) {
        const audioMessage = await this.prisma.audioMessage.findUnique({
            where: { id: audioMessageId },
        });
        if (!audioMessage) {
            throw new common_1.BadRequestException('Áudio não encontrado');
        }
        return this.mapToResponseDto(audioMessage);
    }
    async deleteAudio(audioMessageId) {
        await this.prisma.audioMessage.delete({
            where: { id: audioMessageId },
        });
    }
    mapToResponseDto(audio) {
        return {
            id: audio.id,
            chatId: audio.chatId,
            contactId: audio.contactId,
            audioPath: audio.audioPath,
            mimeType: audio.mimeType,
            sizeBytes: audio.sizeBytes,
            duration: audio.duration ? parseFloat(audio.duration.toString()) : undefined,
            status: audio.status,
            transcript: audio.transcript,
            transcriptConfidence: audio.transcriptConfidence
                ? parseFloat(audio.transcriptConfidence.toString())
                : undefined,
            transcribedAt: audio.transcribedAt,
            transcriptionTimeMs: audio.transcriptionTimeMs,
            errorMessage: audio.errorMessage,
            createdAt: audio.createdAt,
            updatedAt: audio.updatedAt,
        };
    }
};
exports.AudioService = AudioService;
exports.AudioService = AudioService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AudioService);
//# sourceMappingURL=audio.service.js.map