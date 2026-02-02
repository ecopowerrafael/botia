import { Test, TestingModule } from '@nestjs/testing';
import { AudioQueueProcessor } from './audio.processor';

describe('AudioQueueProcessor', () => {
  let processor: AudioQueueProcessor;
  let mockAudioService: any;
  let mockConversationService: any;

  beforeEach(async () => {
    mockAudioService = {
      transcribeAudio: jest.fn().mockResolvedValue({
        transcript: 'Hello, how are you?',
        duration: 5.2,
      }),
    };

    mockConversationService = {
      processConversation: jest.fn().mockResolvedValue({
        intent: 'greeting',
        response: 'Olá! Como posso ajudar?',
        tts: {
          url: 's3://bucket/response.mp3',
          duration: 3.5,
        },
      }),
      saveMessage: jest.fn().mockResolvedValue({
        id: 'msg-123',
        type: 'user',
        content: 'Hello',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AudioQueueProcessor,
        {
          provide: 'AudioService',
          useValue: mockAudioService,
        },
        {
          provide: 'ConversationService',
          useValue: mockConversationService,
        },
      ],
    }).compile();

    processor = module.get<AudioQueueProcessor>(AudioQueueProcessor);
  });

  describe('handleAudioTranscription', () => {
    it('should transcribe audio successfully', async () => {
      const job = {
        id: 'job-123',
        data: {
          audioUrl: 's3://bucket/audio.mp3',
          chatId: 'chat-123',
          tenantId: 'tenant-789',
          language: 'pt',
        },
        progress: jest.fn(),
      };

      const result = await processor.handleAudioTranscription(job);

      expect(result).toHaveProperty('transcript');
      expect(job.progress).toHaveBeenCalledWith(50);
      expect(mockAudioService.transcribeAudio).toHaveBeenCalled();
    });

    it('should throw error on invalid audio URL', async () => {
      mockAudioService.transcribeAudio.mockRejectedValueOnce(
        new Error('Invalid URL'),
      );

      const job = {
        id: 'job-123',
        data: {
          audioUrl: 'invalid',
          chatId: 'chat-123',
          tenantId: 'tenant-789',
          language: 'pt',
        },
        progress: jest.fn(),
      };

      await expect(processor.handleAudioTranscription(job)).rejects.toThrow(
        'Invalid URL',
      );
    });

    it('should update job progress during transcription', async () => {
      const job = {
        id: 'job-123',
        data: {
          audioUrl: 's3://bucket/audio.mp3',
          chatId: 'chat-123',
          tenantId: 'tenant-789',
          language: 'pt',
        },
        progress: jest.fn(),
      };

      await processor.handleAudioTranscription(job);

      expect(job.progress).toHaveBeenCalledWith(10);
      expect(job.progress).toHaveBeenCalledWith(50);
      expect(job.progress).toHaveBeenCalledWith(100);
    });
  });

  describe('handleConversationProcessing', () => {
    it('should process conversation successfully', async () => {
      const job = {
        id: 'job-123',
        data: {
          transcript: 'Hello, how are you?',
          chatId: 'chat-123',
          tenantId: 'tenant-789',
          aiProvider: 'ollama',
        },
        progress: jest.fn(),
      };

      const result = await processor.handleConversationProcessing(job);

      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('response');
      expect(mockConversationService.processConversation).toHaveBeenCalled();
    });

    it('should handle AI processing errors gracefully', async () => {
      mockConversationService.processConversation.mockRejectedValueOnce(
        new Error('AI error'),
      );

      const job = {
        id: 'job-123',
        data: {
          transcript: 'Test',
          chatId: 'chat-123',
          tenantId: 'tenant-789',
          aiProvider: 'ollama',
        },
        progress: jest.fn(),
      };

      await expect(processor.handleConversationProcessing(job)).rejects.toThrow(
        'AI error',
      );
    });

    it('should save transcript to message history', async () => {
      const job = {
        id: 'job-123',
        data: {
          transcript: 'Hello, how are you?',
          chatId: 'chat-123',
          tenantId: 'tenant-789',
          aiProvider: 'ollama',
        },
        progress: jest.fn(),
      };

      await processor.handleConversationProcessing(job);

      expect(mockConversationService.saveMessage).toHaveBeenCalled();
    });
  });
});
