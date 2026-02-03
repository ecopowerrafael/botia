export declare class ProcessConversationWithAIDto {
    audioMessageId: string;
    transcript: string;
    chatId: string;
    tenantId: string;
    aiProvider?: 'OPENAI' | 'GEMINI' | 'OLLAMA';
    voice?: string;
}
export declare class ConversationWithAIResponseDto {
    audioMessageId: string;
    transcript: string;
    intent: string;
    intentConfidence: number;
    entities: any[];
    aiResponse: string;
    aiProvider: string;
    aiConfidence: number;
    responseAudioUrl?: string;
    responseAudioDuration?: number;
    cartItemsAdded?: any[];
    cartTotal?: number;
    nextStep: string;
    suggestions: string[];
    timestamp: string;
    processingTimeMs: number;
    message: string;
}
export interface ConversationContextForAI {
    chatHistory: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>;
    currentIntent: string;
    entities: any[];
    cartItems: any[];
    cartTotal: number;
    userPreferences?: any;
}
export declare class MultiTurnConversationDto {
    chatId: string;
    tenantId: string;
    userMessage: string;
    aiProvider?: 'OPENAI' | 'GEMINI' | 'OLLAMA';
    includeContext?: boolean;
}
export declare class MultiTurnConversationResponseDto {
    chatId: string;
    userMessage: string;
    aiResponse: string;
    aiProvider: string;
    followUpQuestions?: string[];
    cartStatus?: {
        itemCount: number;
        total: number;
    };
    timestamp: string;
    processingTimeMs: number;
}
