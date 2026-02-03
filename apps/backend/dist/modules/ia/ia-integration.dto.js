"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiTurnConversationResponseDto = exports.MultiTurnConversationDto = exports.ConversationWithAIResponseDto = exports.ProcessConversationWithAIDto = void 0;
class ProcessConversationWithAIDto {
    audioMessageId;
    transcript;
    chatId;
    tenantId;
    aiProvider;
    voice;
}
exports.ProcessConversationWithAIDto = ProcessConversationWithAIDto;
class ConversationWithAIResponseDto {
    audioMessageId;
    transcript;
    intent;
    intentConfidence;
    entities;
    aiResponse;
    aiProvider;
    aiConfidence;
    responseAudioUrl;
    responseAudioDuration;
    cartItemsAdded;
    cartTotal;
    nextStep;
    suggestions;
    timestamp;
    processingTimeMs;
    message;
}
exports.ConversationWithAIResponseDto = ConversationWithAIResponseDto;
class MultiTurnConversationDto {
    chatId;
    tenantId;
    userMessage;
    aiProvider;
    includeContext;
}
exports.MultiTurnConversationDto = MultiTurnConversationDto;
class MultiTurnConversationResponseDto {
    chatId;
    userMessage;
    aiResponse;
    aiProvider;
    followUpQuestions;
    cartStatus;
    timestamp;
    processingTimeMs;
}
exports.MultiTurnConversationResponseDto = MultiTurnConversationResponseDto;
//# sourceMappingURL=ia-integration.dto.js.map