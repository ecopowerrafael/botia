export declare class GenerateTTSDto {
    text: string;
    language?: string;
    voice?: string;
    speed?: number;
    chatId?: string;
}
export declare class GetCachedTTSDto {
    text: string;
    language?: string;
}
export declare class GenerateTTSResponseDto {
    success: boolean;
    audioUrl: string;
    audioBase64?: string;
    audioFormat: string;
    durationSeconds: number;
    text: string;
    language: string;
    cacheHit: boolean;
    model: string;
    processingTimeMs: number;
    message: string;
}
export declare class ListCacheResponseDto {
    total: number;
    cached: CacheItemDto[];
}
export declare class CacheItemDto {
    id: string;
    text: string;
    language: string;
    audioUrl: string;
    createdAt: string;
    expiresAt: string;
    hitCount: number;
}
export declare class TTSStatusResponseDto {
    ollamaHealthy: boolean;
    ttsModelAvailable: boolean;
    ttsModel: string;
    cacheStats: {
        totalCached: number;
        diskUsageMB: number;
        oldestCacheDate: string;
        newestCacheDate: string;
    };
}
export interface TTSVoice {
    id: string;
    name: string;
    language: string;
    gender: 'male' | 'female';
    quality: 'low' | 'medium' | 'high';
}
export declare const AVAILABLE_VOICES: TTSVoice[];
export declare class ProcessAndRespondDto {
    transcript: string;
    chatId: string;
    intent?: string;
    cartItems?: any[];
    responseText?: string;
    voice?: string;
}
export declare class ProcessAndRespondResponseDto {
    transcript: string;
    intent: string;
    responseText: string;
    responseAudioUrl?: string;
    responseAudioDuration?: number;
    cartItemsAdded?: any[];
    nextStep: string;
    message: string;
}
