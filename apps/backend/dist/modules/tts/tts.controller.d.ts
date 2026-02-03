import { TTSService } from './tts.service';
import { GenerateTTSDto, GenerateTTSResponseDto, ListCacheResponseDto, TTSStatusResponseDto, GetCachedTTSDto, ProcessAndRespondDto, ProcessAndRespondResponseDto } from './tts.dto';
export declare class TTSController {
    private readonly ttsService;
    constructor(ttsService: TTSService);
    generateTTS(dto: GenerateTTSDto): Promise<GenerateTTSResponseDto>;
    getCachedTTS(dto: GetCachedTTSDto): Promise<any>;
    listCache(): Promise<ListCacheResponseDto>;
    getStatus(): Promise<TTSStatusResponseDto>;
    processAndRespond(dto: ProcessAndRespondDto): Promise<ProcessAndRespondResponseDto>;
    cleanupCache(): Promise<{
        removed: number;
        message: string;
    }>;
}
