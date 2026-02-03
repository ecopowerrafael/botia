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
var IAIntegrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IAIntegrationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma.service");
const ia_service_1 = require("./ia.service");
const conversation_service_1 = require("../conversation/conversation.service");
const intent_service_1 = require("../intent/intent.service");
const cart_service_1 = require("../cart/cart.service");
const tts_service_1 = require("../tts/tts.service");
let IAIntegrationService = IAIntegrationService_1 = class IAIntegrationService {
    prisma;
    iaService;
    conversationService;
    intentService;
    cartService;
    ttsService;
    logger = new common_1.Logger(IAIntegrationService_1.name);
    constructor(prisma, iaService, conversationService, intentService, cartService, ttsService) {
        this.prisma = prisma;
        this.iaService = iaService;
        this.conversationService = conversationService;
        this.intentService = intentService;
        this.cartService = cartService;
        this.ttsService = ttsService;
    }
    async processConversationWithAI(dto) {
        const startTime = Date.now();
        const { audioMessageId, transcript, chatId, tenantId, aiProvider = 'OLLAMA', voice = 'pt-br-female', } = dto;
        const intentResult = await this.intentService.processTranscript({
            audioMessageId,
            transcript,
            confidence: 1.0,
            chatId,
        });
        const conversationContext = await this.getConversationContextForAI(chatId, tenantId);
        const systemPrompt = this.buildSystemPrompt(intentResult.intent, conversationContext, tenantId);
        let aiResponse = '';
        let aiConfidence = 0.5;
        try {
            const iaResult = await this.iaService.processMessage({
                tenantId,
                chatId,
                userMessage: transcript,
                provider: aiProvider,
                systemPrompt,
                conversationHistory: conversationContext.chatHistory,
            });
            aiResponse = iaResult.response;
            aiConfidence = 0.85;
        }
        catch (error) {
            this.logger.warn('Erro ao processar com IA, usando fallback:', error);
            aiResponse = intentResult.responseText || 'Entendi sua mensagem!';
            aiConfidence = 0.6;
        }
        let cartItemsAdded = [];
        let cartTotal = 0;
        if (intentResult.shouldAddToCart &&
            intentResult.cartItems &&
            intentResult.cartItems.length > 0) {
            for (const item of intentResult.cartItems) {
                try {
                    await this.cartService.addItem({
                        tenantId,
                        chatId,
                        contactId: chatId,
                        productName: item.productName,
                        quantity: item.quantity,
                        unitPrice: 0,
                    });
                    cartItemsAdded.push(item);
                }
                catch (error) {
                    this.logger.warn('Erro ao adicionar item ao carrinho:', error);
                }
            }
            const cart = await this.cartService.getCart(tenantId, chatId);
            cartTotal = cart?.total || 0;
        }
        let responseAudioUrl;
        let responseAudioDuration;
        try {
            const ttsResult = await this.ttsService.generateTTS({
                text: aiResponse,
                language: 'pt',
                voice,
            });
            responseAudioUrl = ttsResult.audioUrl;
            responseAudioDuration = ttsResult.durationSeconds;
        }
        catch (error) {
            this.logger.warn('Erro ao gerar TTS:', error);
        }
        const nextStep = this.determineNextStep(intentResult.intent, cartItemsAdded.length > 0);
        const suggestions = this.generateSuggestionsFromAI(aiResponse, intentResult.intent, cartTotal);
        const processingTimeMs = Date.now() - startTime;
        return {
            audioMessageId,
            transcript,
            intent: intentResult.intent,
            intentConfidence: intentResult.confidence,
            entities: intentResult.entities,
            aiResponse,
            aiProvider,
            aiConfidence,
            responseAudioUrl,
            responseAudioDuration,
            cartItemsAdded: cartItemsAdded.length > 0 ? cartItemsAdded : undefined,
            cartTotal: cartTotal > 0 ? cartTotal : undefined,
            nextStep,
            suggestions,
            timestamp: new Date().toISOString(),
            processingTimeMs,
            message: 'Conversa processada com IA com sucesso',
        };
    }
    async multiTurnConversation(dto) {
        const startTime = Date.now();
        const { chatId, tenantId, userMessage, aiProvider = 'OLLAMA', includeContext = true, } = dto;
        const chatHistory = await this.conversationService.getConversationHistory({
            chatId,
            limit: 10,
            offset: 0,
        });
        const conversationHistory = chatHistory.messages.map((msg) => ({
            role: msg.type === 'USER_AUDIO' ? 'user' : 'assistant',
            content: msg.content,
        }));
        let systemPrompt = 'Você é um assistente de vendas prestativo.';
        if (includeContext) {
            const context = await this.getConversationContextForAI(chatId, tenantId);
            systemPrompt = this.buildSystemPrompt('MULTI_TURN', context, tenantId);
        }
        const iaResult = await this.iaService.processMessage({
            tenantId,
            chatId,
            userMessage,
            provider: aiProvider,
            systemPrompt,
            conversationHistory,
        });
        const followUpQuestions = this.generateFollowUpQuestions(iaResult.response, userMessage);
        const cart = await this.cartService.getCart(tenantId, chatId);
        const processingTimeMs = Date.now() - startTime;
        return {
            chatId,
            userMessage,
            aiResponse: iaResult.response,
            aiProvider,
            followUpQuestions,
            cartStatus: {
                itemCount: cart?.items?.length || 0,
                total: cart?.total || 0,
            },
            timestamp: new Date().toISOString(),
            processingTimeMs,
        };
    }
    async getConversationContextForAI(chatId, tenantId) {
        const historyResponse = await this.conversationService.getConversationHistory({
            chatId,
            limit: 10,
            offset: 0,
        });
        const chatHistory = historyResponse.messages.map((msg) => ({
            role: msg.type === 'USER_AUDIO' ? 'user' : 'assistant',
            content: msg.content,
        }));
        const contextResponse = await this.conversationService.getConversationContext({ chatId });
        return {
            chatHistory,
            currentIntent: contextResponse.recentIntents[0] || 'PERGUNTA',
            entities: [],
            cartItems: contextResponse.cartStatus.items,
            cartTotal: contextResponse.cartStatus.total,
        };
    }
    buildSystemPrompt(intent, context, tenantId) {
        let prompt = `Você é um assistente de vendas expert, prestativo e profissional.

OBJETIVO DA CONVERSA: ${this.getIntentDescription(intent)}

CONTEXTO DO CLIENTE:
- Intenção atual: ${intent}
- Histórico: ${context.chatHistory.length} mensagens anteriores
- Itens no carrinho: ${context.cartItems.length}
- Total do carrinho: R$ ${context.cartTotal.toFixed(2)}

INSTRUÇÕES:
1. Responda em português brasileiro, naturalmente
2. Seja conciso (máximo 100 caracteres por linha)
3. Use emojis quando apropriado para engajamento
4. Se cliente quer comprar: confirme os itens e preco
5. Se cliente tem dúvida: esclareça completamente
6. Se cliente reclama: ofereça solução imediata
7. Sempre mantenha tom amigável e profissional

RESPONDA APENAS O TEXTO DA RESPOSTA, SEM FORMATAÇÃO EXTRA.`;
        if (context.cartItems.length > 0) {
            prompt += `\n\nITENS NO CARRINHO:`;
            context.cartItems.forEach((item) => {
                prompt += `\n- ${item.productName}: ${item.quantity}x`;
            });
        }
        return prompt;
    }
    getIntentDescription(intent) {
        const descriptions = {
            COMPRA: 'Cliente deseja adquirir produtos',
            PERGUNTA: 'Cliente está fazendo pergunta sobre produtos ou serviço',
            RECLAMACAO: 'Cliente está insatisfeito ou reclamando',
            SAUDACAO: 'Cliente está cumprimentando',
            HORARIO: 'Cliente pergunta sobre horário de atendimento',
            LOCALIZACAO: 'Cliente pergunta sobre endereço/localização',
            CARDAPIO: 'Cliente quer ver catálogo/cardápio',
            CANCELAR_PEDIDO: 'Cliente deseja cancelar um pedido',
            REEMBOLSO: 'Cliente solicita reembolso',
            RASTREAMENTO: 'Cliente pergunta sobre status do pedido',
            PROMOCAO: 'Cliente busca promoções/descontos',
            FEEDBACK: 'Cliente deixa avaliação/feedback',
            SUPORTE: 'Cliente solicita suporte técnico',
            AGENTE_HUMANO: 'Cliente quer falar com pessoa real',
            MULTI_TURN: 'Conversa de múltiplas mensagens',
        };
        return descriptions[intent] || 'Interação com cliente';
    }
    determineNextStep(intent, hasItems) {
        if (hasItems)
            return 'MOSTRAR_CARRINHO';
        switch (intent) {
            case 'COMPRA':
                return 'AGUARDAR_CONFIRMACAO';
            case 'PERGUNTA':
            case 'CARDAPIO':
                return 'AGUARDAR_ENTRADA';
            case 'RECLAMACAO':
                return 'ESCALAR_SUPORTE';
            default:
                return 'AGUARDAR_ENTRADA';
        }
    }
    generateSuggestionsFromAI(aiResponse, intent, cartTotal) {
        const suggestions = [];
        if (aiResponse.includes('R$') ||
            aiResponse.includes('preço') ||
            intent === 'COMPRA') {
            suggestions.push('Confirmar compra');
            suggestions.push('Ver mais produtos');
        }
        if (cartTotal > 0) {
            suggestions.push('Prosseguir para pagamento');
            suggestions.push('Revisar carrinho');
        }
        if (intent === 'PERGUNTA' || intent === 'DUVIDA') {
            suggestions.push('Ver mais detalhes');
            suggestions.push('Falar com suporte');
        }
        if (intent === 'RECLAMACAO') {
            suggestions.push('Abrir ticket de suporte');
            suggestions.push('Falar com gerente');
        }
        if (!suggestions.includes('Voltar ao início')) {
            suggestions.push('Voltar ao início');
        }
        return suggestions;
    }
    generateFollowUpQuestions(aiResponse, userMessage) {
        const followUps = [];
        if (userMessage.includes('produto') || aiResponse.includes('produto')) {
            followUps.push('Qual é o preço?');
            followUps.push('Tem outras cores?');
            followUps.push('Qual é o tamanho?');
        }
        if (userMessage.includes('preço') || aiResponse.includes('R$')) {
            followUps.push('Tem desconto?');
            followUps.push('Parcelado?');
            followUps.push('Quero comprar!');
        }
        if (userMessage.includes('entrega') || aiResponse.includes('entrega')) {
            followUps.push('Quanto tempo demora?');
            followUps.push('Qual é o valor?');
            followUps.push('Qual é o prazo?');
        }
        if (followUps.length === 0) {
            followUps.push('Me mostre mais produtos');
            followUps.push('Ver cardápio');
            followUps.push('Entrar em contato');
        }
        return followUps.slice(0, 3);
    }
};
exports.IAIntegrationService = IAIntegrationService;
exports.IAIntegrationService = IAIntegrationService = IAIntegrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ia_service_1.IAService,
        conversation_service_1.ConversationService,
        intent_service_1.IntentService,
        cart_service_1.CartService,
        tts_service_1.TTSService])
], IAIntegrationService);
//# sourceMappingURL=ia-integration.service.js.map