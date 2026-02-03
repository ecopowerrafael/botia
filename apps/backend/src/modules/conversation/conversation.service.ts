import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { IntentService } from '../intent/intent.service';
import { TTSService } from '../tts/tts.service';
import { CartService } from '../cart/cart.service';
import {
  ProcessConversationDto,
  ProcessConversationResponseDto,
  GetConversationHistoryDto,
  GetConversationHistoryResponseDto,
  GetConversationContextDto,
  ConversationContextDto,
  ClearConversationHistoryDto,
} from './conversation.dto';

/**
 * ConversationService: Orquestra o fluxo completo de conversação
 * 1. Recebe transcrição de áudio
 * 2. Detecta intenção
 * 3. Extrai entidades (produtos, quantidades, etc)
 * 4. Executa ações (adicionar ao carrinho, etc)
 * 5. Gera resposta em texto
 * 6. Gera áudio da resposta (TTS)
 * 7. Retorna tudo ao cliente
 */
@Injectable()
export class ConversationService {
  constructor(
    private prisma: PrismaService,
    private intentService: IntentService,
    private ttsService: TTSService,
    private cartService: CartService,
  ) {}

  /**
   * Processar conversa completa: áudio → texto → intenção → resposta → áudio
   */
  async processConversation(
    dto: ProcessConversationDto,
  ): Promise<ProcessConversationResponseDto> {
    const startTime = Date.now();
    const { audioMessageId, transcript, chatId, context, voice } = dto;

    // Passo 1: Detectar intenção e extrair entidades
    const intentResult = await this.intentService.processTranscript({
      audioMessageId,
      transcript,
      confidence: 1.0, // já vem do Whisper com confiança
      chatId,
      context,
    });

    // Passo 2: Executar ações baseadas na intenção
    let cartItemsAdded: any[] = [];
    let cartTotal: number = 0;

    if (intentResult.shouldAddToCart && intentResult.cartItems) {
      for (const item of intentResult.cartItems) {
        try {
          await this.cartService.addItem({
            tenantId: this.extractTenantId(chatId),
            chatId,
            contactId: chatId, // Use chatId as contactId
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: 0, // será preenchido pelo frontend
          });
          cartItemsAdded.push(item);
        } catch (error) {
          console.warn('Erro ao adicionar item ao carrinho:', error);
        }
      }

      // Obter total do carrinho
      const cart = await this.cartService.getCart(
        this.extractTenantId(chatId),
        chatId,
      );
      cartTotal = cart ? (cart as any).total || 0 : 0;
    }

    // Passo 3: Gerar resposta em áudio (TTS)
    let responseAudioUrl: string | undefined;
    let responseAudioDuration: number | undefined;

    if (intentResult.responseText) {
      try {
        const ttsResult = await this.ttsService.generateTTS({
          text: intentResult.responseText,
          language: 'pt',
          voice: voice || 'pt-br-female',
        });
        responseAudioUrl = ttsResult.audioUrl;
        responseAudioDuration = ttsResult.durationSeconds;
      } catch (error) {
        console.warn('Erro ao gerar áudio de resposta:', error);
      }
    }

    // Passo 4: Determinar próximo passo
    const nextStep = this.determineNextStep(
      intentResult.intent,
      cartItemsAdded.length > 0,
    );

    // Passo 5: Gerar sugestões de ações
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

  /**
   * Obter histórico de conversa
   */
  async getConversationHistory(
    dto: GetConversationHistoryDto,
  ): Promise<GetConversationHistoryResponseDto> {
    const { chatId, limit = 50, offset = 0 } = dto;

    // Buscar mensagens de áudio
    const audioMessages = await this.prisma.audioMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    // Converter para histórico
    const messages = audioMessages.map((msg: any) => ({
      id: msg.id,
      timestamp: msg.createdAt.toISOString(),
      type: 'USER_AUDIO' as const,
      content: msg.transcript || '(áudio não transcrito)',
      audioUrl: msg.audioPath,
      intent: (msg as any).intent,
      entities: (msg as any).entities,
    }));

    return {
      chatId,
      messages,
      totalMessages: audioMessages.length,
      limit,
      offset,
    };
  }

  /**
   * Obter contexto da conversa (resumo)
   */
  async getConversationContext(
    dto: GetConversationContextDto,
  ): Promise<ConversationContextDto> {
    const { chatId } = dto;

    // Contar mensagens
    const totalMessages = await this.prisma.audioMessage.count({
      where: { chatId },
    });

    // Última mensagem
    const lastMessage = await this.prisma.audioMessage.findFirst({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
    });

    // Status do carrinho
    const cart = await this.cartService.getCart(
      this.extractTenantId(chatId),
      chatId,
    );

    // Intenções recentes
    const recentMessages = await this.prisma.audioMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const recentIntents = recentMessages
      .map((m: any) => m.intent)
      .filter((i: any) => i);

    // Sugestões de próximas ações
    const suggestedNextActions = this.generateSuggestions(
      recentIntents[0] || 'PERGUNTA',
      (cart as any)?.total || 0,
    );

    return {
      chatId,
      totalMessages,
      lastMessageTime: lastMessage?.createdAt.toISOString() || 'N/A',
      cartStatus: {
        itemCount: (cart as any)?.items?.length || 0,
        total: (cart as any)?.total || 0,
        items: (cart as any)?.items || [],
      },
      recentIntents,
      suggestedNextActions,
    };
  }

  /**
   * Limpar histórico de conversa
   */
  async clearConversationHistory(
    dto: ClearConversationHistoryDto,
  ): Promise<{ deleted: number; message: string }> {
    const { chatId, beforeDate } = dto;

    const where: any = { chatId };
    if (beforeDate) {
      where.createdAt = { lte: new Date(beforeDate) };
    }

    const result = await this.prisma.audioMessage.deleteMany({ where });

    return {
      deleted: result.count,
      message: `${result.count} mensagens removidas`,
    };
  }

  /**
   * ==================== PRIVATE METHODS ====================
   */

  /**
   * Extrair tenantId do chatId (formato: tenant-id:chat-id)
   */
  private extractTenantId(chatId: string): string {
    const parts = chatId.split(':');
    return parts[0] || 'default-tenant';
  }

  /**
   * Encontrar productId pelo nome (buscar em DB ou lista conhecida)
   */
  private findProductId(productName: string): string {
    // TODO: Implementar busca real no banco de dados de produtos
    // Por enquanto, usar hash do nome como ID
    return `product-${productName.toLowerCase().replace(/\s+/g, '-')}`;
  }

  /**
   * Determinar próximo passo baseado na intenção
   */
  private determineNextStep(intent: string, hasItemsInCart: boolean): string {
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

  /**
   * Gerar sugestões de próximos passos
   */
  private generateSuggestions(intent: string, cartTotal: number): string[] {
    const suggestions: string[] = [];

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

    // Sugestão sempre presente
    if (!suggestions.includes('Iniciar do zero')) {
      suggestions.push('Voltar ao início');
    }

    return suggestions;
  }
}
