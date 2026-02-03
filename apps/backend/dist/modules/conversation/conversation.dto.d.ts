export declare class ProcessConversationDto {
    audioMessageId: string;
    transcript: string;
    chatId: string;
    context?: string;
    voice?: string;
}
export declare class ProcessConversationResponseDto {
    audioMessageId: string;
    transcript: string;
    intent: string;
    intentConfidence: number;
    entities: any[];
    responseText: string;
    responseAudioUrl?: string;
    responseAudioDuration?: number;
    cartItemsAdded?: any[];
    cartTotal?: number;
    nextStep: string;
    suggestions?: string[];
    timestamp: string;
    processingTimeMs: number;
    message: string;
}
export declare class GetConversationHistoryDto {
    chatId: string;
    limit?: number;
    offset?: number;
}
export declare class ConversationMessageDto {
    id: string;
    timestamp: string;
    type: 'USER_AUDIO' | 'USER_TEXT' | 'BOT_AUDIO' | 'BOT_TEXT';
    content: string;
    audioUrl?: string;
    intent?: string;
    entities?: any[];
}
export declare class GetConversationHistoryResponseDto {
    chatId: string;
    messages: ConversationMessageDto[];
    totalMessages: number;
    limit: number;
    offset: number;
}
export declare class GetConversationContextDto {
    chatId: string;
}
export declare class ConversationContextDto {
    chatId: string;
    totalMessages: number;
    lastMessageTime: string;
    cartStatus: {
        itemCount: number;
        total: number;
        items: any[];
    };
    recentIntents: string[];
    userPreferences?: {
        preferredVoice: string;
        language: string;
        timezone: string;
    };
    suggestedNextActions: string[];
}
export declare class ClearConversationHistoryDto {
    chatId: string;
    beforeDate?: string;
}
