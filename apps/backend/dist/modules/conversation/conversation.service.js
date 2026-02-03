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
exports.ConversationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma.service");
const intent_service_1 = require("../intent/intent.service");
const tts_service_1 = require("../tts/tts.service");
const cart_service_1 = require("../cart/cart.service");
let ConversationService = class ConversationService {
    prisma;
    intentService;
    ttsService;
    cartService;
    constructor(prisma, intentService, ttsService, cartService) {
        this.prisma = prisma;
        this.intentService = intentService;
        this.ttsService = ttsService;
        this.cartService = cartService;
    }
    async processConversation(dto) {
        const startTime = Date.now();
        const { audioMessageId, transcript, chatId, context, voice } = dto;
        const intentResult = await this.intentService.processTranscript({
            audioMessageId,
            transcript,
            confidence: 1.0,
            chatId,
            context,
        });
        let cartItemsAdded = [];
        let cartTotal = 0;
        if (intentResult.shouldAddToCart && intentResult.cartItems) {
            for (const item of intentResult.cartItems) {
                try {
                    await this.cartService.addItem({
                        tenantId: this.extractTenantId(chatId),
                        chatId,
                        contactId: chatId,
                        productName: item.productName,
                        quantity: item.quantity,
                        unitPrice: 0,
                    });
                    cartItemsAdded.push(item);
                }
                catch (error) {
                    console.warn('Erro ao adicionar item ao carrinho:', error);
                }
            }
            const cart = await this.cartService.getCart(this.extractTenantId(chatId), chatId);
            cartTotal = cart ? cart.total || 0 : 0;
        }
        let responseAudioUrl;
        let responseAudioDuration;
        if (intentResult.responseText) {
            try {
                const ttsResult = await this.ttsService.generateTTS({
                    text: intentResult.responseText,
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
        const nextStep = this.determineNextStep(intentResult.intent, cartItemsAdded.length > 0);
        const suggestions = this.generateSuggestions(intentResult.intent, cartTotal);
        const processingTimeMs = Date.now() - startTime;
        return {
            audioMessageId,
            transcript,
            intent: intentResult.intent,
            intentConfidence: intentResult.confidence,
            entities: intentResult.entities,
            responseText: intentResult.responseText || 'Entendi sua mensagem!',
            responseAudioUrl,
            responseAudioDuration,
            cartItemsAdded: cartItemsAdded.length > 0 ? cartItemsAdded : undefined,
            cartTotal: cartTotal > 0 ? cartTotal : undefined,
            nextStep,
            suggestions,
            timestamp: new Date().toISOString(),
            processingTimeMs,
            message: 'Conversa processada com sucesso',
        };
    }
    async getConversationHistory(dto) {
        const { chatId, limit = 50, offset = 0 } = dto;
        const audioMessages = await this.prisma.audioMessage.findMany({
            where: { chatId },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit,
        });
        const messages = audioMessages.map((msg) => ({
            id: msg.id,
            timestamp: msg.createdAt.toISOString(),
            type: 'USER_AUDIO',
            content: msg.transcript || '(áudio não transcrito)',
            audioUrl: msg.audioPath,
            intent: msg.intent,
            entities: msg.entities,
        }));
        return {
            chatId,
            messages,
            totalMessages: audioMessages.length,
            limit,
            offset,
        };
    }
    async getConversationContext(dto) {
        const { chatId } = dto;
        const totalMessages = await this.prisma.audioMessage.count({
            where: { chatId },
        });
        const lastMessage = await this.prisma.audioMessage.findFirst({
            where: { chatId },
            orderBy: { createdAt: 'desc' },
        });
        const cart = await this.cartService.getCart(this.extractTenantId(chatId), chatId);
        const recentMessages = await this.prisma.audioMessage.findMany({
            where: { chatId },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
        const recentIntents = recentMessages
            .map((m) => m.intent)
            .filter((i) => i);
        const suggestedNextActions = this.generateSuggestions(recentIntents[0] || 'PERGUNTA', cart?.total || 0);
        return {
            chatId,
            totalMessages,
            lastMessageTime: lastMessage?.createdAt.toISOString() || 'N/A',
            cartStatus: {
                itemCount: cart?.items?.length || 0,
                total: cart?.total || 0,
                items: cart?.items || [],
            },
            recentIntents,
            suggestedNextActions,
        };
    }
    async clearConversationHistory(dto) {
        const { chatId, beforeDate } = dto;
        const where = { chatId };
        if (beforeDate) {
            where.createdAt = { lte: new Date(beforeDate) };
        }
        const result = await this.prisma.audioMessage.deleteMany({ where });
        return {
            deleted: result.count,
            message: `${result.count} mensagens removidas`,
        };
    }
    extractTenantId(chatId) {
        const parts = chatId.split(':');
        return parts[0] || 'default-tenant';
    }
    findProductId(productName) {
        return `product-${productName.toLowerCase().replace(/\s+/g, '-')}`;
    }
    determineNextStep(intent, hasItemsInCart) {
        if (hasItemsInCart) {
            return 'MOSTRAR_CARRINHO';
        }
        switch (intent) {
            case 'COMPRA':
                return 'AGUARDAR_CONFIRMACAO';
            case 'PERGUNTA':
            case 'CARDAPIO':
            case 'HORARIO':
                return 'AGUARDAR_ENTRADA';
            case 'CANCELAR_PEDIDO':
                return 'PEDIR_CONFIRMACAO';
            case 'RECLAMACAO':
                return 'ESCALAR_SUPORTE';
            default:
                return 'AGUARDAR_ENTRADA';
        }
    }
    generateSuggestions(intent, cartTotal) {
        const suggestions = [];
        if (intent === 'COMPRA' || cartTotal > 0) {
            suggestions.push('Confirmar carrinho');
            suggestions.push('Prosseguir para pagamento');
        }
        if (intent === 'PERGUNTA' || intent === 'CARDAPIO') {
            suggestions.push('Ver mais produtos');
            suggestions.push('Ver promoções');
        }
        if (intent === 'HORARIO') {
            suggestions.push('Localização');
            suggestions.push('Contato');
        }
        if (intent === 'RECLAMACAO') {
            suggestions.push('Falar com agente');
            suggestions.push('Abrir ticket de suporte');
        }
        if (!suggestions.includes('Iniciar do zero')) {
            suggestions.push('Voltar ao início');
        }
        return suggestions;
    }
};
exports.ConversationService = ConversationService;
exports.ConversationService = ConversationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        intent_service_1.IntentService,
        tts_service_1.TTSService,
        cart_service_1.CartService])
], ConversationService);
//# sourceMappingURL=conversation.service.js.map