import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

/**
 * DTO: Gerar áudio a partir de texto (TTS)
 */
export class GenerateTTSDto {
  @IsString()
  text: string; // Texto a converter em fala

  @IsString()
  @IsOptional()
  language?: string; // 'pt', 'en', 'es' (default: 'pt')

  @IsString()
  @IsOptional()
  voice?: string; // voz (male, female) - dependendo do modelo

  @IsNumber()
  @IsOptional()
  speed?: number; // velocidade (0.5 a 2.0, default: 1.0)

  @IsString()
  @IsOptional()
  chatId?: string; // para cache
}

/**
 * DTO: Usar áudio em cache se disponível
 */
export class GetCachedTTSDto {
  @IsString()
  text: string;

  @IsString()
  @IsOptional()
  language?: string;
}

/**
 * Resposta: Áudio gerado
 */
export class GenerateTTSResponseDto {
  success: boolean;
  audioUrl: string; // URL ou S3 path
  audioBase64?: string; // Opcional: base64 do áudio
  audioFormat: string; // 'mp3', 'ogg', 'wav'
  durationSeconds: number; // duração do áudio gerado
  text: string; // texto original
  language: string;
  cacheHit: boolean; // veio do cache?
  model: string; // modelo usado (piper, glow-tts, etc)
  processingTimeMs: number;
  message: string;
}

/**
 * Resposta: Listar caches
 */
export class ListCacheResponseDto {
  total: number;
  cached: CacheItemDto[];
}

/**
 * Item de cache
 */
export class CacheItemDto {
  id: string;
  text: string;
  language: string;
  audioUrl: string;
  createdAt: string;
  expiresAt: string; // 7 dias
  hitCount: number; // quantas vezes foi usado
}

/**
 * Resposta: Status do TTS
 */
export class TTSStatusResponseDto {
  ollamaHealthy: boolean;
  ttsModelAvailable: boolean;
  ttsModel: string; // modelo disponível (piper, glow-tts)
  cacheStats: {
    totalCached: number;
    diskUsageMB: number;
    oldestCacheDate: string;
    newestCacheDate: string;
  };
}

/**
 * Voz disponível
 */
export interface TTSVoice {
  id: string; // 'pt-br-male', 'pt-br-female'
  name: string; // 'Portuguese Brazil - Male'
  language: string;
  gender: 'male' | 'female';
  quality: 'low' | 'medium' | 'high'; // velocidade de processamento
}

/**
 * Vozes disponíveis em diferentes modelos
 */
export const AVAILABLE_VOICES: TTSVoice[] = [
  {
    id: 'pt-br-male',
    name: 'Portuguese Brazil - Male',
    language: 'pt',
    gender: 'male',
    quality: 'high',
  },
  {
    id: 'pt-br-female',
    name: 'Portuguese Brazil - Female',
    language: 'pt',
    gender: 'female',
    quality: 'high',
  },
  {
    id: 'pt-pt-male',
    name: 'Portuguese Portugal - Male',
    language: 'pt',
    gender: 'male',
    quality: 'high',
  },
  {
    id: 'en-us-male',
    name: 'English US - Male',
    language: 'en',
    gender: 'male',
    quality: 'high',
  },
  {
    id: 'en-us-female',
    name: 'English US - Female',
    language: 'en',
    gender: 'female',
    quality: 'high',
  },
  {
    id: 'es-male',
    name: 'Spanish - Male',
    language: 'es',
    gender: 'male',
    quality: 'high',
  },
];

/**
 * DTO: Processar e responder transcrição
 * (usado pelo ConversationService)
 */
export class ProcessAndRespondDto {
  @IsString()
  transcript: string; // Transcrição do áudio

  @IsString()
  chatId: string;

  @IsString()
  @IsOptional()
  intent?: string; // intent já detectada

  @IsArray()
  @IsOptional()
  cartItems?: any[]; // itens a adicionar

  @IsString()
  @IsOptional()
  responseText?: string; // resposta em texto

  @IsString()
  @IsOptional()
  voice?: string; // voz preferida do usuário
}

/**
 * Resposta: Transcrição processada + áudio de resposta
 */
export class ProcessAndRespondResponseDto {
  transcript: string;
  intent: string;
  responseText: string;
  responseAudioUrl?: string; // áudio da resposta
  responseAudioDuration?: number;
  cartItemsAdded?: any[];
  nextStep: string; // "AGUARDAR_ENTRADA", "MOSTRAR_CARRINHO", "PEDIR_PAGAMENTO"
  message: string;
}
