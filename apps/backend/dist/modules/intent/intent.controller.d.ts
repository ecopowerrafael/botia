import { IntentService } from './intent.service';
import { DetectIntentDto, ExtractEntitiesDto, ProcessTranscriptDto, DetectIntentResponseDto, ExtractEntitiesResponseDto, ProcessTranscriptResponseDto } from './intent.dto';
export declare class IntentController {
    private readonly intentService;
    constructor(intentService: IntentService);
    detectIntent(dto: DetectIntentDto): Promise<DetectIntentResponseDto>;
    extractEntities(dto: ExtractEntitiesDto): Promise<ExtractEntitiesResponseDto>;
    processTranscript(dto: ProcessTranscriptDto): Promise<ProcessTranscriptResponseDto>;
}
