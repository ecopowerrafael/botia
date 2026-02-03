import { PrismaService } from '../../shared/prisma.service';
import { ReceiveAudioDto, TranscribeAudioDto, AudioMessageResponseDto, TranscriptionResultDto, AudioListDto } from './dto/audio.dto';
export declare class AudioService {
    private prisma;
    private ollamaApiUrl;
    constructor(prisma: PrismaService);
    receiveAudio(dto: ReceiveAudioDto): Promise<AudioMessageResponseDto>;
    transcribeAudio(dto: TranscribeAudioDto): Promise<TranscriptionResultDto>;
    private callOllamaWhisper;
    private transcribeInBackground;
    getAudioMessages(chatId: string, limit?: number): Promise<AudioListDto>;
    getAudioMessage(audioMessageId: string): Promise<AudioMessageResponseDto>;
    deleteAudio(audioMessageId: string): Promise<void>;
    private mapToResponseDto;
}
