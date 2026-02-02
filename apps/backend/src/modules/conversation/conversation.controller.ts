import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import {
  ProcessConversationDto,
  ProcessConversationResponseDto,
  GetConversationHistoryDto,
  GetConversationHistoryResponseDto,
  GetConversationContextDto,
  ConversationContextDto,
  ClearConversationHistoryDto,
} from './conversation.dto';

@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  /**
   * POST /conversation/process
   * Processar conversa completa: áudio transcrito → intenção → resposta → TTS
   * Este é o endpoint principal do sistema!
   *
   * Body:
   * {
   *   "audioMessageId": "audio-msg-uuid",
   *   "transcript": "Quero dois vinhos tinto",
   *   "chatId": "chat-123",
   *   "voice": "pt-br-female"
   * }
   *
   * Response (200 OK):
   * {
   *   "audioMessageId": "audio-msg-uuid",
   *   "transcript": "Quero dois vinhos tinto",
   *   "intent": "COMPRA",
   *   "intentConfidence": 0.92,
   *   "entities": [
   *     { "type": "QUANTIDADE", "value": "2" },
   *     { "type": "PRODUTO", "value": "vinho tinto" }
   *   ],
   *   "responseText": "✓ Adicionei 2x vinho tinto ao seu carrinho",
   *   "responseAudioUrl": "s3://bucket/tts/response-hash.ogg",
   *   "responseAudioDuration": 4,
   *   "cartItemsAdded": [
   *     { "productName": "vinho tinto", "quantity": 2 }
   *   ],
   *   "cartTotal": 150.00,
   *   "nextStep": "MOSTRAR_CARRINHO",
   *   "suggestions": [
   *     "Confirmar carrinho",
   *     "Prosseguir para pagamento",
   *     "Ver mais produtos"
   *   ],
   *   "timestamp": "2026-02-01T19:40:00Z",
   *   "processingTimeMs": 8500,
   *   "message": "Conversa processada com sucesso"
   * }
   */
  @Post('process')
  async processConversation(
    @Body() dto: ProcessConversationDto,
  ): Promise<ProcessConversationResponseDto> {
    return await this.conversationService.processConversation(dto);
  }

  /**
   * POST /conversation/history
   * Obter histórico de uma conversa (mensagens anteriores)
   *
   * Body:
   * {
   *   "chatId": "chat-123",
   *   "limit": 50,
   *   "offset": 0
   * }
   *
   * Response (200 OK):
   * {
   *   "chatId": "chat-123",
   *   "messages": [
   *     {
   *       "id": "audio-msg-uuid-1",
   *       "timestamp": "2026-02-01T19:39:00Z",
   *       "type": "USER_AUDIO",
   *       "content": "Quero dois vinhos",
   *       "audioUrl": "s3://...",
   *       "intent": "COMPRA",
   *       "entities": [...]
   *     },
   *     {
   *       "id": "audio-msg-uuid-2",
   *       "timestamp": "2026-02-01T19:38:00Z",
   *       "type": "USER_AUDIO",
   *       "content": "Olá!",
   *       "intent": "SAUDACAO"
   *     }
   *   ],
   *   "totalMessages": 15,
   *   "limit": 50,
   *   "offset": 0
   * }
   */
  @Post('history')
  async getConversationHistory(
    @Body() dto: GetConversationHistoryDto,
  ): Promise<GetConversationHistoryResponseDto> {
    return await this.conversationService.getConversationHistory(dto);
  }

  /**
   * POST /conversation/context
   * Obter contexto resumido da conversa
   *
   * Body:
   * {
   *   "chatId": "chat-123"
   * }
   *
   * Response (200 OK):
   * {
   *   "chatId": "chat-123",
   *   "totalMessages": 15,
   *   "lastMessageTime": "2026-02-01T19:40:00Z",
   *   "cartStatus": {
   *     "itemCount": 2,
   *     "total": 150.00,
   *     "items": [
   *       { "productName": "vinho tinto", "quantity": 2 }
   *     ]
   *   },
   *   "recentIntents": ["COMPRA", "PERGUNTA", "CARDAPIO"],
   *   "suggestedNextActions": [
   *     "Confirmar carrinho",
   *     "Prosseguir para pagamento"
   *   ]
   * }
   */
  @Post('context')
  async getConversationContext(
    @Body() dto: GetConversationContextDto,
  ): Promise<ConversationContextDto> {
    return await this.conversationService.getConversationContext(dto);
  }

  /**
   * POST /conversation/clear-history
   * Limpar histórico de conversa (cuidado!)
   *
   * Body:
   * {
   *   "chatId": "chat-123",
   *   "beforeDate": "2026-02-01T00:00:00Z"  (opcional)
   * }
   *
   * Response (200 OK):
   * {
   *   "deleted": 10,
   *   "message": "10 mensagens removidas"
   * }
   */
  @Post('clear-history')
  async clearConversationHistory(
    @Body() dto: ClearConversationHistoryDto,
  ): Promise<{ deleted: number; message: string }> {
    return await this.conversationService.clearConversationHistory(dto);
  }

  /**
   * GET /conversation/history/:chatId
   * Atalho: obter histórico por chatId
   */
  @Get('history/:chatId')
  async getHistoryByChat(
    @Param('chatId') chatId: string,
  ): Promise<GetConversationHistoryResponseDto> {
    return await this.conversationService.getConversationHistory({
      chatId,
      limit: 50,
      offset: 0,
    });
  }
}
