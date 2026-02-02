import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { IAService } from './ia.service';
import { ConversationService } from '../conversation/conversation.service';
import { IntentService } from '../intent/intent.service';
import { CartService } from '../cart/cart.service';
import { TTSService } from '../tts/tts.service';
import {
  ProcessConversationWithAIDto,
  ConversationWithAIResponseDto,
  ConversationContextForAI,
  MultiTurnConversationDto,
  MultiTurnConversationResponseDto,
} from './ia-integration.dto';

/**
 * IAIntegrationService: Integra IA com ConversationService
 * Fluxo: Transcrição → Intenção → Contexto → IA → Resposta → TTS
 */
@Injectable()
export class IAIntegrationService {
  private readonly logger = new Logger(IAIntegrationService.name);

  constructor(
    private prisma: PrismaService,
    private iaService: IAService,
    private conversationService: ConversationService,
    private intentService: IntentService,
    private cartService: CartService,
    private ttsService: TTSService,
  ) {}

  /**
   * Processar conversa completa com IA integrada
   * Fluxo: áudio → intenção → contexto → IA → resposta → TTS
   */
  async processConversationWithAI(
    dto: ProcessConversationWithAIDto,
  ): Promise<ConversationWithAIResponseDto> {
    const startTime = Date.now();
    const {
      audioMessageId,
      transcript,
      chatId,
      tenantId,
      aiProvider = 'OLLAMA',
      voice = 'pt-br-female',
    } = dto;

    // Passo 1: Detectar intenção
    const intentResult = await this.intentService.processTranscript({
      audioMessageId,
      transcript,
      confidence: 1.0,
      chatId,
    });

    // Passo 2: Obter contexto da conversa
    const conversationContext = await this.getConversationContextForAI(
      chatId,
      tenantId,
    );

    // Passo 3: Construir prompt customizado para IA
    const systemPrompt = this.buildSystemPrompt(
      intentResult.intent,
      conversationContext,
      tenantId,
    );

    // Passo 4: Chamar IA com contexto
    let aiResponse = '';
    let aiConfidence = 0.5;

    try {
      const iaResult = await this.iaService.processMessage({
        tenantId,
        chatId,
        userMessage: transcript,
        provider: aiProvider as any,
        systemPrompt,
        conversationHistory: conversationContext.chatHistory,
      });

      aiResponse = iaResult.response;
      aiConfidence = 0.85; // IA fornece resposta confiável
    } catch (error) {
      this.logger.warn('Erro ao processar com IA, usando fallback:', error);
      aiResponse = intentResult.responseText || 'Entendi sua mensagem!';
      aiConfidence = 0.6;
    }

    // Passo 5: Executar ações automáticas baseadas na intenção
    let cartItemsAdded: any[] = [];
    let cartTotal: number = 0;

    if (
      intentResult.shouldAddToCart &&
      intentResult.cartItems &&
      intentResult.cartItems.length > 0
    ) {
      for (const item of intentResult.cartItems) {
        try {
          await this.cartService.addItem({
            tenantId,
            chatId,
            productName: item.productName,
            quantity: item.quantity,
            price: 0,
            productId: `product-${item.productName.toLowerCase().replace(/\s+/g, '-')}`,
          });
          cartItemsAdded.push(item);
        } catch (error) {
          this.logger.warn('Erro ao adicionar item ao carrinho:', error);
        }
      }

      const cart = await this.cartService.getCart(tenantId, chatId);
      cartTotal = (cart as any)?.total || 0;
    }

    // Passo 6: Gerar áudio da resposta IA
    let responseAudioUrl: string | undefined;
    let responseAudioDuration: number | undefined;

    try {
      const ttsResult = await this.ttsService.generateTTS({
        text: aiResponse,
        language: 'pt',
        voice,
      });
      responseAudioUrl = ttsResult.audioUrl;
      responseAudioDuration = ttsResult.durationSeconds;
    } catch (error) {
      this.logger.warn('Erro ao gerar TTS:', error);
    }

    // Passo 7: Determinar próximo passo
    const nextStep = this.determineNextStep(
      intentResult.intent,
      cartItemsAdded.length > 0,
    );

    // Passo 8: Gerar sugestões baseadas na resposta IA
    const suggestions = this.generateSuggestionsFromAI(
      aiResponse,
      intentResult.intent,
      cartTotal,
    );

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

  /**
   * Multi-turn conversation: texto → IA → resposta
   * (sem necessidade de áudio)
   */
  async multiTurnConversation(
    dto: MultiTurnConversationDto,
  ): Promise<MultiTurnConversationResponseDto> {
    const startTime = Date.now();
    const {
      chatId,
      tenantId,
      userMessage,
      aiProvider = 'OLLAMA',
      includeContext = true,
    } = dto;

    // Obter histórico e contexto
    const chatHistory = await this.conversationService.getConversationHistory({
      chatId,
      limit: 10,
      offset: 0,
    });

    const conversationHistory = chatHistory.messages.map((msg) => ({
      role: msg.type === 'USER_AUDIO' ? ('user' as const) : ('assistant' as const),
      content: msg.content,
    }));

    let systemPrompt = 'Você é um assistente de vendas prestativo.';

    if (includeContext) {
      const context = await this.getConversationContextForAI(
        chatId,
        tenantId,
      );
      systemPrompt = this.buildSystemPrompt('MULTI_TURN', context, tenantId);
    }

    // Chamar IA
    const iaResult = await this.iaService.processMessage({
      tenantId,
      chatId,
      userMessage,
      provider: aiProvider as any,
      systemPrompt,
      conversationHistory,
    });

    // Gerar sugestões de próximas perguntas (follow-ups)
    const followUpQuestions = this.generateFollowUpQuestions(
      iaResult.response,
      userMessage,
    );

    // Status do carrinho
    const cart = await this.cartService.getCart(tenantId, chatId);

    const processingTimeMs = Date.now() - startTime;

    return {
      chatId,
      userMessage,
      aiResponse: iaResult.response,
      aiProvider,
      followUpQuestions,
      cartStatus: {
        itemCount: (cart as any)?.items?.length || 0,
        total: (cart as any)?.total || 0,
      },
      timestamp: new Date().toISOString(),
      processingTimeMs,
    };
  }

  /**
   * ==================== PRIVATE METHODS ====================
   */

  /**
   * Obter contexto da conversa para usar em prompts
   */
  private async getConversationContextForAI(
    chatId: string,
    tenantId: string,
  ): Promise<ConversationContextForAI> {
    // Histórico de chat
    const historyResponse = await this.conversationService.getConversationHistory(
      {
        chatId,
        limit: 10,
        offset: 0,
      },
    );

    const chatHistory = historyResponse.messages.map((msg) => ({
      role: msg.type === 'USER_AUDIO' ? ('user' as const) : ('assistant' as const),
      content: msg.content,
    }));

    // Context de conversa
    const contextResponse = await this.conversationService.getConversationContext(
      { chatId },
    );

    return {
      chatHistory,
      currentIntent: contextResponse.recentIntents[0] || 'PERGUNTA',
      entities: [],
      cartItems: contextResponse.cartStatus.items,
      cartTotal: contextResponse.cartStatus.total,
    };
  }

  /**
   * Construir prompt customizado para IA
   */
  private buildSystemPrompt(
    intent: string,
    context: ConversationContextForAI,
    tenantId: string,
  ): string {
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

  /**
   * Descrição legível da intenção
   */
  private getIntentDescription(intent: string): string {
    const descriptions: Record<string, string> = {
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

  /**
   * Determinar próximo passo
   */
  private determineNextStep(intent: string, hasItems: boolean): string {
    if (hasItems) return 'MOSTRAR_CARRINHO';

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

  /**
   * Gerar sugestões baseadas na resposta da IA
   */
  private generateSuggestionsFromAI(
    aiResponse: string,
    intent: string,
    cartTotal: number,
  ): string[] {
    const suggestions: string[] = [];

    // Verificar se IA mencionou preço ou compra
    if (
      aiResponse.includes('R$') ||
      aiResponse.includes('preço') ||
      intent === 'COMPRA'
    ) {
      suggestions.push('Confirmar compra');
      suggestions.push('Ver mais produtos');
    }

    // Se cliente tem items no carrinho
    if (cartTotal > 0) {
      suggestions.push('Prosseguir para pagamento');
      suggestions.push('Revisar carrinho');
    }

    // Sugestões baseadas na intenção
    if (intent === 'PERGUNTA' || intent === 'DUVIDA') {
      suggestions.push('Ver mais detalhes');
      suggestions.push('Falar com suporte');
    }

    if (intent === 'RECLAMACAO') {
      suggestions.push('Abrir ticket de suporte');
      suggestions.push('Falar com gerente');
    }

    // Sempre manter opção de voltar
    if (!suggestions.includes('Voltar ao início')) {
      suggestions.push('Voltar ao início');
    }

    return suggestions;
  }

  /**
   * Gerar perguntas de follow-up (próximas questões)
   */
  private generateFollowUpQuestions(
    aiResponse: string,
    userMessage: string,
  ): string[] {
    const followUps: string[] = [];

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

    return followUps.slice(0, 3); // máximo 3 sugestões
  }
}
