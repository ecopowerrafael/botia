import { IAIntegrationService } from './ia-integration.service';
import { ProcessConversationWithAIDto, ConversationWithAIResponseDto, MultiTurnConversationDto, MultiTurnConversationResponseDto } from './ia-integration.dto';
export declare class IAIntegrationController {
    private readonly iaIntegrationService;
    constructor(iaIntegrationService: IAIntegrationService);
    processConversationWithAI(dto: ProcessConversationWithAIDto): Promise<ConversationWithAIResponseDto>;
    multiTurnConversation(dto: MultiTurnConversationDto): Promise<MultiTurnConversationResponseDto>;
}
