import { ConversationService } from './conversation.service';
import { ProcessConversationDto, ProcessConversationResponseDto, GetConversationHistoryDto, GetConversationHistoryResponseDto, GetConversationContextDto, ConversationContextDto, ClearConversationHistoryDto } from './conversation.dto';
export declare class ConversationController {
    private readonly conversationService;
    constructor(conversationService: ConversationService);
    processConversation(dto: ProcessConversationDto): Promise<ProcessConversationResponseDto>;
    getConversationHistory(dto: GetConversationHistoryDto): Promise<GetConversationHistoryResponseDto>;
    getConversationContext(dto: GetConversationContextDto): Promise<ConversationContextDto>;
    clearConversationHistory(dto: ClearConversationHistoryDto): Promise<{
        deleted: number;
        message: string;
    }>;
    getHistoryByChat(chatId: string): Promise<GetConversationHistoryResponseDto>;
}
