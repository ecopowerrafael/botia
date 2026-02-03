import { PrismaService } from '../../shared/prisma.service';
import { IAService } from './ia.service';
import { ConversationService } from '../conversation/conversation.service';
import { IntentService } from '../intent/intent.service';
import { CartService } from '../cart/cart.service';
import { TTSService } from '../tts/tts.service';
import { ProcessConversationWithAIDto, ConversationWithAIResponseDto, MultiTurnConversationDto, MultiTurnConversationResponseDto } from './ia-integration.dto';
export declare class IAIntegrationService {
    private prisma;
    private iaService;
    private conversationService;
    private intentService;
    private cartService;
    private ttsService;
    private readonly logger;
    constructor(prisma: PrismaService, iaService: IAService, conversationService: ConversationService, intentService: IntentService, cartService: CartService, ttsService: TTSService);
    processConversationWithAI(dto: ProcessConversationWithAIDto): Promise<ConversationWithAIResponseDto>;
    multiTurnConversation(dto: MultiTurnConversationDto): Promise<MultiTurnConversationResponseDto>;
    private getConversationContextForAI;
    private buildSystemPrompt;
    private getIntentDescription;
    private determineNextStep;
    private generateSuggestionsFromAI;
    private generateFollowUpQuestions;
}
