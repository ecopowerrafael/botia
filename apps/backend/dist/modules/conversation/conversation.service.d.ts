import { PrismaService } from '../../shared/prisma.service';
import { IntentService } from '../intent/intent.service';
import { TTSService } from '../tts/tts.service';
import { CartService } from '../cart/cart.service';
import { ProcessConversationDto, ProcessConversationResponseDto, GetConversationHistoryDto, GetConversationHistoryResponseDto, GetConversationContextDto, ConversationContextDto, ClearConversationHistoryDto } from './conversation.dto';
export declare class ConversationService {
    private prisma;
    private intentService;
    private ttsService;
    private cartService;
    constructor(prisma: PrismaService, intentService: IntentService, ttsService: TTSService, cartService: CartService);
    processConversation(dto: ProcessConversationDto): Promise<ProcessConversationResponseDto>;
    getConversationHistory(dto: GetConversationHistoryDto): Promise<GetConversationHistoryResponseDto>;
    getConversationContext(dto: GetConversationContextDto): Promise<ConversationContextDto>;
    clearConversationHistory(dto: ClearConversationHistoryDto): Promise<{
        deleted: number;
        message: string;
    }>;
    private extractTenantId;
    private findProductId;
    private determineNextStep;
    private generateSuggestions;
}
