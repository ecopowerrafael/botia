import { AudioService } from './audio.service';
import { ReceiveAudioDto, TranscribeAudioDto } from './dto/audio.dto';
export declare class AudioController {
    private audioService;
    constructor(audioService: AudioService);
    receiveAudio(dto: ReceiveAudioDto): Promise<import("./dto/audio.dto").AudioMessageResponseDto>;
    transcribeAudio(dto: TranscribeAudioDto): Promise<import("./dto/audio.dto").TranscriptionResultDto>;
    getAudioMessages(chatId: string, limit?: string): Promise<import("./dto/audio.dto").AudioListDto>;
    getAudioMessage(audioMessageId: string): Promise<import("./dto/audio.dto").AudioMessageResponseDto>;
    deleteAudio(audioMessageId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
