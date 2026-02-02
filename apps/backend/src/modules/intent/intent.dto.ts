import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';

// DTO: Detectar intenção do texto
export class DetectIntentDto {
  @IsString()
  text: string;

  @IsString()
  @IsOptional()
  language?: string; // 'pt', 'en', 'es'

  @IsString()
  @IsOptional()
  context?: string; // contexto anterior (ex: "usuário já viu cardápio")

  @IsString()
  @IsOptional()
  chatId?: string; // para manter histórico da conversa
}

// DTO: Extrair entidades (produtos, quantidades)
export class ExtractEntitiesDto {
  @IsString()
  text: string;

  @IsString()
  intent: string; // tipo de intenção detectada

  @IsArray()
  @IsOptional()
  knownEntities?: string[]; // lista de produtos/categorias conhecidas

  @IsString()
  @IsOptional()
  language?: string;
}

// Resposta: Intenção detectada
export class DetectIntentResponseDto {
  intent: string; // COMPRA, PERGUNTA, RECLAMACAO, SAUDACAO, HORARIO, CANCELAR_PEDIDO, etc
  confidence: number; // 0-1
  subIntents?: string[]; // intents secundárias
  entities: EntityDto[];
  sentiment: 'positivo' | 'negativo' | 'neutro';
  suggestedAction: string; // ação recomendada para o bot
  rawText: string;
  language: string;
}

// Entidade extraída (produto, quantidade, etc)
export class EntityDto {
  type: 'PRODUTO' | 'QUANTIDADE' | 'CATEGORIA' | 'PRECO' | 'TEMPO' | 'LOCALIZACAO' | 'CONTATO'; // tipo
  value: string; // valor extraído
  confidence: number; // 0-1
  position: { start: number; end: number }; // posição no texto original
}

// Resposta: Entidades extraídas
export class ExtractEntitiesResponseDto {
  text: string;
  entities: EntityDto[];
  totalEntities: number;
  language: string;
}

// DTO: Processar transcrição e gerar ação
export class ProcessTranscriptDto {
  @IsString()
  audioMessageId: string;

  @IsString()
  transcript: string;

  @IsNumber()
  confidence: number; // confiança da transcrição (Whisper)

  @IsString()
  chatId: string;

  @IsString()
  @IsOptional()
  context?: string;
}

// Resposta: Ação a executar
export class ProcessTranscriptResponseDto {
  audioMessageId: string;
  transcript: string;
  intent: string;
  confidence: number;
  entities: EntityDto[];
  suggestedAction: string;
  // Ações automáticas:
  shouldAddToCart?: boolean; // executar CartService.addItem()
  shouldGenerateResponse?: boolean; // gerar resposta em TTS
  shouldNotifyVendor?: boolean; // notificar vendedor
  cartItems?: any[]; // itens a adicionar ao carrinho
  responseText?: string; // resposta em texto
}

// Intent patterns conhecidos
export const KNOWN_INTENTS = {
  COMPRA: 'Usuário deseja comprar algo',
  PERGUNTA: 'Usuário tem dúvida',
  RECLAMACAO: 'Usuário está insatisfeito',
  SAUDACAO: 'Cumprimento simples',
  HORARIO: 'Pergunta sobre horário de atendimento',
  LOCALIZACAO: 'Pergunta sobre endereço',
  CARDAPIO: 'Pede para ver cardápio',
  CANCELAR_PEDIDO: 'Deseja cancelar pedido',
  REEMBOLSO: 'Solicita reembolso',
  RASTREAMENTO: 'Pergunta sobre status do pedido',
  PROMOÇÃO: 'Pergunta sobre promoções/descontos',
  FEEDBACK: 'Deixar avaliação ou comentário',
  SUPORTE: 'Solicita suporte técnico',
  AGENTE_HUMANO: 'Quer falar com pessoa',
};
