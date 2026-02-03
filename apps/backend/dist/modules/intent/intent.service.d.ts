import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../shared/prisma.service';
import { DetectIntentDto, ExtractEntitiesDto, ProcessTranscriptDto, DetectIntentResponseDto, ExtractEntitiesResponseDto, ProcessTranscriptResponseDto } from './intent.dto';
export declare class IntentService {
    private httpService;
    private prisma;
    private ollamaApiUrl;
    constructor(httpService: HttpService, prisma: PrismaService);
    detectIntent(dto: DetectIntentDto): Promise<DetectIntentResponseDto>;
    extractEntities(dto: ExtractEntitiesDto): Promise<ExtractEntitiesResponseDto>;
    processTranscript(dto: ProcessTranscriptDto): Promise<ProcessTranscriptResponseDto>;
    private suggestAction;
    private detectIntentFallback;
    private callOllama;
    private parseOllamaJson;
}
