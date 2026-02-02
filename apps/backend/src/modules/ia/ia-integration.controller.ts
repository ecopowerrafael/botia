import { Controller, Post, Body } from '@nestjs/common';
import { IAIntegrationService } from './ia-integration.service';
import {
  ProcessConversationWithAIDto,
  ConversationWithAIResponseDto,
  MultiTurnConversationDto,
  MultiTurnConversationResponseDto,
} from './ia-integration.dto';

@Controller('ia/integration')
export class IAIntegrationController {
  constructor(private readonly iaIntegrationService: IAIntegrationService) {}

  /**
   * POST /ia/integration/process-with-ai
   * Processar conversa completa com IA integrada
   * Fluxo: áudio transcrito → intenção → contexto → IA → resposta → TTS
   *
   * Este é um SUPER ENDPOINT que une:
   * - IntentService (detecta intenção)
   * - IAService (gera resposta inteligente)
   * - CartService (adiciona ao carrinho)
   * - TTSService (gera áudio da resposta)
   * - ConversationService (gerencia contexto)
   *
   * Body:
   * {
   *   "audioMessageId": "audio-uuid-123",
   *   "transcript": "Quero dois vinhos tinto",
   *   "chatId": "chat-123",
   *   "tenantId": "tenant-789",
   *   "aiProvider": "OLLAMA",
   *   "voice": "pt-br-female"
   * }
   *
   * Response (200 OK):
   * {
   *   "audioMessageId": "audio-uuid-123",
   *   "transcript": "Quero dois vinhos tinto",
   *   "intent": "COMPRA",
   *   "intentConfidence": 0.92,
   *   "entities": [
   *     { "type": "QUANTIDADE", "value": "2" },
   *     { "type": "PRODUTO", "value": "vinho tinto" }
   *   ],
   *   "aiResponse": "Perfeito! Você escolheu 2x Vinho Tinto Reserva. São R$ 75.00 cada, total R$ 150.00. Quer adicionar mais algo ou prosseguir para pagamento?",
   *   "aiProvider": "OLLAMA",
   *   "aiConfidence": 0.85,
   *   "responseAudioUrl": "s3://bucket/tts/response-ai-hash.ogg",
   *   "responseAudioDuration": 7,
   *   "cartItemsAdded": [
   *     { "productName": "vinho tinto", "quantity": 2 }
   *   ],
   *   "cartTotal": 162.00,
   *   "nextStep": "MOSTRAR_CARRINHO",
   *   "suggestions": [
   *     "Confirmar compra",
   *     "Ver mais produtos",
   *     "Prosseguir para pagamento"
   *   ],
   *   "timestamp": "2026-02-01T19:45:00Z",
   *   "processingTimeMs": 12500,
   *   "message": "Conversa processada com IA com sucesso"
   * }
   *
   * DIFERENÇA vs /conversation/process:
   * - Usa IA para gerar resposta (OLLAMA, OpenAI, Gemini)
   * - Resposta é mais natural e contextualizada
   * - Inclui sugestões de follow-up inteligentes
   * - Maior tempo de processamento (~12s) mas melhor qualidade
   */
  @Post('process-with-ai')
  async processConversationWithAI(
    @Body() dto: ProcessConversationWithAIDto,
  ): Promise<ConversationWithAIResponseDto> {
    return await this.iaIntegrationService.processConversationWithAI(dto);
  }

  /**
   * POST /ia/integration/multi-turn
   * Conversa multi-turn com IA (sem necessidade de áudio)
   * Ideal para texto direto ou segundas/terceiras mensagens
   *
   * Body:
   * {
   *   "chatId": "chat-123",
   *   "tenantId": "tenant-789",
   *   "userMessage": "E se eu comprar 5 unidades, tem desconto?",
   *   "aiProvider": "OLLAMA",
   *   "includeContext": true
   * }
   *
   * Response (200 OK):
   * {
   *   "chatId": "chat-123",
   *   "userMessage": "E se eu comprar 5 unidades, tem desconto?",
   *   "aiResponse": "Ótima pergunta! Para compras acima de 5 unidades, oferecemos 10% de desconto. Você teria 5x Vinho Tinto = R$ 337.50 ao invés de R$ 375.00. Quer aproveitar?",
   *   "aiProvider": "OLLAMA",
   *   "followUpQuestions": [
   *     "Quero comprar 5!",
   *     "Tem outro desconto?",
   *     "Preciso de 10 unidades"
   *   ],
   *   "cartStatus": {
   *     "itemCount": 2,
   *     "total": 162.00
   *   },
   *   "timestamp": "2026-02-01T19:46:00Z",
   *   "processingTimeMs": 3500
   * }
   *
   * QUANDO USAR:
   * - Segunda/terceira mensagem sem áudio
   * - Cliente digita texto diretamente
   * - Followup questions
   * - Sem necessidade de TTS (cliente já ouve)
   */
  @Post('multi-turn')
  async multiTurnConversation(
    @Body() dto: MultiTurnConversationDto,
  ): Promise<MultiTurnConversationResponseDto> {
    return await this.iaIntegrationService.multiTurnConversation(dto);
  }
}
