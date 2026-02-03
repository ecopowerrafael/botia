import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../shared/prisma.service';
import { GenerateTTSDto, GenerateTTSResponseDto, ListCacheResponseDto, TTSStatusResponseDto, ProcessAndRespondDto, ProcessAndRespondResponseDto } from './tts.dto';
export declare class TTSService {
    private httpService;
    private prisma;
    private ollamaApiUrl;
    constructor(httpService: HttpService, prisma: PrismaService);
    generateTTS(dto: GenerateTTSDto): Promise<GenerateTTSResponseDto>;
    listCache(): Promise<ListCacheResponseDto>;
    getStatus(): Promise<TTSStatusResponseDto>;
    processAndRespond(dto: ProcessAndRespondDto): Promise<ProcessAndRespondResponseDto>;
    cleanupExpiredCache(): Promise<number>;
    private callOllamaTTS;
    private getCachedTTS;
    private hashText;
    private estimateDuration;
    private extractAudioUrl;
    private suggestNextStep;
}
