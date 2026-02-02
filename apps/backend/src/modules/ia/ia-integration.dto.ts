import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { IAService } from '../ia/ia.service';
import { ConversationService } from '../conversation/conversation.service';
import { IntentService } from '../intent/intent.service';
import { CartService } from '../cart/cart.service';

/**
 * DTO: Processar conversa com IA integrada
 */
export class ProcessConversationWithAIDto {
  audioMessageId: string; // áudio recebido
  transcript: string; // já transcrito pelo Whisper
  chatId: string;
  tenantId: string;
  aiProvider?: 'OPENAI' | 'GEMINI' | 'OLLAMA'; // qual IA usar (default: OLLAMA)
  voice?: string; // voz preferida
}

/**
 * Resposta: Conversa processada com IA
 */
export class ConversationWithAIResponseDto {
  audioMessageId: string;
  transcript: string;
  intent: string; // de IntentService
  intentConfidence: number;
  entities: any[]; // produtos, quantidades
  // Respostas da IA:
  aiResponse: string; // resposta em texto
  aiProvider: string; // qual IA foi usada
  aiConfidence: number; // confiança da resposta
  // Áudio:
  responseAudioUrl?: string; // áudio da resposta
  responseAudioDuration?: number;
  // Carrinho:
  cartItemsAdded?: any[];
  cartTotal?: number;
  // Próximos passos:
  nextStep: string;
  suggestions: string[];
  timestamp: string;
  processingTimeMs: number;
  message: string;
}

/**
 * Contexto da conversa para usar em prompts
 */
export interface ConversationContextForAI {
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  currentIntent: string;
  entities: any[];
  cartItems: any[];
  cartTotal: number;
  userPreferences?: any;
}

/**
 * Sistema de multi-turn conversation
 */
export class MultiTurnConversationDto {
  chatId: string;
  tenantId: string;
  userMessage: string; // pode ser texto ou transcrição de áudio
  aiProvider?: 'OPENAI' | 'GEMINI' | 'OLLAMA';
  includeContext?: boolean; // incluir contexto de carrinho, histórico, etc
}

export class MultiTurnConversationResponseDto {
  chatId: string;
  userMessage: string;
  aiResponse: string;
  aiProvider: string;
  followUpQuestions?: string[]; // sugestões de próximas perguntas
  cartStatus?: {
    itemCount: number;
    total: number;
  };
  timestamp: string;
  processingTimeMs: number;
}
