import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { IntentService } from './intent.service';
import {
  DetectIntentDto,
  ExtractEntitiesDto,
  ProcessTranscriptDto,
  DetectIntentResponseDto,
  ExtractEntitiesResponseDto,
  ProcessTranscriptResponseDto,
} from './intent.dto';

@Controller('intent')
export class IntentController {
  constructor(private readonly intentService: IntentService) {}

  /**
   * POST /intent/detect
   * Detecta a intenção principal do texto
   *
   * Body:
   * {
   *   "text": "Quero 2 vinhos tinto",
   *   "language": "pt",
   *   "context": "usuário já viu cardápio"
   * }
   *
   * Response (200 OK):
   * {
   *   "intent": "COMPRA",
   *   "confidence": 0.92,
   *   "entities": [
   *     { "type": "PRODUTO", "value": "vinho tinto", "confidence": 0.90 },
   *     { "type": "QUANTIDADE", "value": "2", "confidence": 0.95 }
   *   ],
   *   "sentiment": "positivo",
   *   "suggestedAction": "Adicionar ao carrinho"
   * }
   */
  @Post('detect')
  async detectIntent(
    @Body() dto: DetectIntentDto,
  ): Promise<DetectIntentResponseDto> {
    return await this.intentService.detectIntent(dto);
  }

  /**
   * POST /intent/extract-entities
   * Extrai entidades específicas do texto (produto, quantidade, preço, etc)
   *
   * Body:
   * {
   *   "text": "Quero 2 vinhos tinto a R$ 50",
   *   "intent": "COMPRA",
   *   "knownEntities": ["vinho tinto", "vinho branco"]
   * }
   *
   * Response (200 OK):
   * {
   *   "entities": [
   *     { "type": "QUANTIDADE", "value": "2", "confidence": 0.95 },
   *     { "type": "PRODUTO", "value": "vinho tinto", "confidence": 0.90 },
   *     { "type": "PRECO", "value": "50", "confidence": 0.88 }
   *   ]
   * }
   */
  @Post('extract-entities')
  async extractEntities(
    @Body() dto: ExtractEntitiesDto,
  ): Promise<ExtractEntitiesResponseDto> {
    return await this.intentService.extractEntities(dto);
  }

  /**
   * POST /intent/process-transcript
   * Processa uma transcrição completa:
   * 1. Detecta intenção
   * 2. Extrai entidades
   * 3. Sugere ação (adicionar ao carrinho, responder, notificar, etc)
   *
   * Body:
   * {
   *   "audioMessageId": "audio-uuid-123",
   *   "transcript": "Quero dois vinhos tinto",
   *   "confidence": 0.92,
   *   "chatId": "chat-123"
   * }
   *
   * Response (200 OK):
   * {
   *   "audioMessageId": "audio-uuid-123",
   *   "transcript": "Quero dois vinhos tinto",
   *   "intent": "COMPRA",
   *   "confidence": 0.92,
   *   "entities": [
   *     { "type": "QUANTIDADE", "value": "2" },
   *     { "type": "PRODUTO", "value": "vinho tinto" }
   *   ],
   *   "shouldAddToCart": true,
   *   "cartItems": [
   *     { "productName": "vinho tinto", "quantity": 2 }
   *   ],
   *   "shouldGenerateResponse": true,
   *   "responseText": "✓ Adicionei 2x vinho tinto ao seu carrinho",
   *   "suggestedAction": "Adicionar ao carrinho"
   * }
   */
  @Post('process-transcript')
  async processTranscript(
    @Body() dto: ProcessTranscriptDto,
  ): Promise<ProcessTranscriptResponseDto> {
    return await this.intentService.processTranscript(dto);
  }
}
