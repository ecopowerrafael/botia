import { AudioStatus } from '../../../shared/enums';
export declare class ReceiveAudioDto {
    chatId: string;
    contactId: string;
    tenantId: string;
    audioPath: string;
    mimeType: string;
    sizeBytes: number;
    durationSeconds?: number;
}
export declare class TranscribeAudioDto {
    audioMessageId: string;
    audioPath: string;
    mimeType: string;
    language?: string;
}
export declare class AudioMessageResponseDto {
    id: string;
    chatId: string;
    contactId: string;
    audioPath: string;
    mimeType: string;
    sizeBytes: number;
    duration?: number;
    status: AudioStatus;
    transcript?: string;
    transcriptConfidence?: number;
    transcribedAt?: Date;
    transcriptionTimeMs?: number;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class TranscriptionResultDto {
    success: boolean;
    audioMessageId: string;
    transcript: string;
    confidence: number;
    language: string;
    duration: number;
    processTimeMs: number;
    error?: string;
}
export declare class AudioListDto {
    chatId: string;
    audioMessages: AudioMessageResponseDto[];
    totalCount: number;
    lastUpdated: Date;
}
