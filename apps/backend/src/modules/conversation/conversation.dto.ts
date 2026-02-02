import { IsString, IsArray, IsOptional } from 'class-validator';

/**
 * DTO: Processar conversa completa (áudio → texto → intenção → resposta → áudio)
 */
export class ProcessConversationDto {
  @IsString()
  audioMessageId: string; // áudio que foi recebido

  @IsString()
  transcript: string; // transcrição do áudio (já feita pelo Whisper)

  @IsString()
  chatId: string;

  @IsString()
  @IsOptional()
  context?: string; // contexto da conversa

  @IsString()
  @IsOptional()
  voice?: string; // voz preferida do usuário (pt-br-female, pt-br-male, etc)
}

/**
 * Resposta completa da conversa
 */
export class ProcessConversationResponseDto {
  audioMessageId: string;
  transcript: string;
  intent: string;
  intentConfidence: number;
  entities: any[]; // produtos, quantidades, etc
  responseText: string;
  responseAudioUrl?: string; // áudio da resposta
  responseAudioDuration?: number;
  cartItemsAdded?: any[]; // itens adicionados ao carrinho
  cartTotal?: number; // valor total do carrinho
  nextStep: string; // próxima ação (AGUARDAR_ENTRADA, MOSTRAR_CARRINHO, PEDIR_PAGAMENTO)
  suggestions?: string[]; // sugestões de próximos passos
  timestamp: string;
  processingTimeMs: number;
  message: string;
}

/**
 * DTO: Obter histórico de conversa
 */
export class GetConversationHistoryDto {
  @IsString()
  chatId: string;

  @IsOptional()
  limit?: number; // número de mensagens (default: 50)

  @IsOptional()
  offset?: number; // paginação (default: 0)
}

/**
 * Item de histórico
 */
export class ConversationMessageDto {
  id: string;
  timestamp: string;
  type: 'USER_AUDIO' | 'USER_TEXT' | 'BOT_AUDIO' | 'BOT_TEXT';
  content: string; // transcrição ou resposta
  audioUrl?: string;
  intent?: string;
  entities?: any[];
}

/**
 * Resposta: Histórico
 */
export class GetConversationHistoryResponseDto {
  chatId: string;
  messages: ConversationMessageDto[];
  totalMessages: number;
  limit: number;
  offset: number;
}

/**
 * DTO: Obter contexto da conversa
 */
export class GetConversationContextDto {
  @IsString()
  chatId: string;
}

/**
 * Contexto da conversa
 */
export class ConversationContextDto {
  chatId: string;
  totalMessages: number;
  lastMessageTime: string;
  cartStatus: {
    itemCount: number;
    total: number;
    items: any[];
  };
  recentIntents: string[]; // últimas intenções detectadas
  userPreferences?: {
    preferredVoice: string;
    language: string;
    timezone: string;
  };
  suggestedNextActions: string[];
}

/**
 * DTO: Limpar histórico de conversa
 */
export class ClearConversationHistoryDto {
  @IsString()
  chatId: string;

  @IsOptional()
  beforeDate?: string; // limpar mensagens antes desta data
}
