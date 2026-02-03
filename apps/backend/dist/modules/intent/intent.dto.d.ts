export declare class DetectIntentDto {
    text: string;
    language?: string;
    context?: string;
    chatId?: string;
}
export declare class ExtractEntitiesDto {
    text: string;
    intent: string;
    knownEntities?: string[];
    language?: string;
}
export declare class DetectIntentResponseDto {
    intent: string;
    confidence: number;
    subIntents?: string[];
    entities: EntityDto[];
    sentiment: 'positivo' | 'negativo' | 'neutro';
    suggestedAction: string;
    rawText: string;
    language: string;
}
export declare class EntityDto {
    type: 'PRODUTO' | 'QUANTIDADE' | 'CATEGORIA' | 'PRECO' | 'TEMPO' | 'LOCALIZACAO' | 'CONTATO';
    value: string;
    confidence: number;
    position: {
        start: number;
        end: number;
    };
}
export declare class ExtractEntitiesResponseDto {
    text: string;
    entities: EntityDto[];
    totalEntities: number;
    language: string;
}
export declare class ProcessTranscriptDto {
    audioMessageId: string;
    transcript: string;
    confidence: number;
    chatId: string;
    context?: string;
}
export declare class ProcessTranscriptResponseDto {
    audioMessageId: string;
    transcript: string;
    intent: string;
    confidence: number;
    entities: EntityDto[];
    suggestedAction: string;
    shouldAddToCart?: boolean;
    shouldGenerateResponse?: boolean;
    shouldNotifyVendor?: boolean;
    cartItems?: any[];
    responseText?: string;
}
export declare const KNOWN_INTENTS: {
    COMPRA: string;
    PERGUNTA: string;
    RECLAMACAO: string;
    SAUDACAO: string;
    HORARIO: string;
    LOCALIZACAO: string;
    CARDAPIO: string;
    CANCELAR_PEDIDO: string;
    REEMBOLSO: string;
    RASTREAMENTO: string;
    PROMOÇÃO: string;
    FEEDBACK: string;
    SUPORTE: string;
    AGENTE_HUMANO: string;
};
