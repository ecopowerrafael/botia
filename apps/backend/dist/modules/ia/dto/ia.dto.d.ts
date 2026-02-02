export declare enum AIProvider {
    OPENAI = "openai",
    GEMINI = "gemini",
    OLLAMA = "ollama"
}
export declare class ProcessMessageDto {
    tenantId: string;
    chatId: string;
    userMessage: string;
    provider?: AIProvider;
    systemPrompt?: string;
    conversationHistory?: Array<{
        role: string;
        content: string;
    }>;
}
export declare class SearchProductsDto {
    tenantId: string;
    query: string;
    category?: string;
    limit?: string;
}
