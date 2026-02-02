import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { QueueService } from './queue.service';

describe('QueueService', () => {
  let service: QueueService;
  let mockAudioQueue: any;
  let mockNotificationQueue: any;
  let mockCleanupQueue: any;
  let mockSyncQueue: any;

  beforeEach(async () => {
    mockAudioQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
      getJobCounts: jest.fn().mockResolvedValue({
        waiting: 2,
        active: 1,
        completed: 10,
        failed: 0,
        delayed: 0,
      }),
      getJob: jest.fn().mockResolvedValue({
        id: 'job-1',
        state: jest.fn().mockResolvedValue('active'),
        progress: jest.fn().mockReturnValue(45),
        attemptsMade: 1,
        opts: { attempts: 3 },
        data: { audioUrl: 'test.mp3' },
        timestamp: Date.now(),
      }),
    };

    mockNotificationQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-2' }),
      getJobCounts: jest.fn().mockResolvedValue({
        waiting: 1,
        active: 0,
        completed: 50,
        failed: 2,
        delayed: 0,
      }),
    };

    mockCleanupQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-3' }),
      getJobCounts: jest.fn().mockResolvedValue({
        waiting: 0,
        active: 0,
        completed: 5,
        failed: 0,
        delayed: 0,
      }),
    };

    mockSyncQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-4' }),
      getJobCounts: jest.fn().mockResolvedValue({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: getQueueToken('audio'),
          useValue: mockAudioQueue,
        },
        {
          provide: getQueueToken('notification'),
          useValue: mockNotificationQueue,
        },
        {
          provide: getQueueToken('cleanup'),
          useValue: mockCleanupQueue,
        },
        {
          provide: getQueueToken('sync'),
          useValue: mockSyncQueue,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  describe('queueAudioTranscription', () => {
    it('should enqueue audio transcription job', async () => {
      const result = await service.queueAudioTranscription({
        audioUrl: 's3://bucket/audio.mp3',
        chatId: 'chat-123',
        tenantId: 'tenant-789',
        language: 'pt',
      });

      expect(result).toHaveProperty('jobId');
      expect(mockAudioQueue.add).toHaveBeenCalledWith(
        'transcribe',
        expect.any(Object),
        expect.objectContaining({
          priority: 10,
          attempts: 3,
          backoff: expect.any(Object),
        }),
      );
    });

    it('should throw error on invalid audio URL', async () => {
      mockAudioQueue.add.mockRejectedValueOnce(new Error('Invalid URL'));

      await expect(
        service.queueAudioTranscription({
          audioUrl: 'invalid',
          chatId: 'chat-123',
          tenantId: 'tenant-789',
          language: 'pt',
        }),
      ).rejects.toThrow('Invalid URL');
    });
  });

  describe('queueConversationProcessing', () => {
    it('should enqueue conversation processing job', async () => {
      const result = await service.queueConversationProcessing({
        transcript: 'Hello, how are you?',
        chatId: 'chat-123',
        tenantId: 'tenant-789',
        aiProvider: 'ollama',
      });

      expect(result).toHaveProperty('jobId');
      expect(mockAudioQueue.add).toHaveBeenCalledWith(
        'process-conversation',
        expect.any(Object),
        expect.objectContaining({
          priority: 8,
          attempts: 2,
        }),
      );
    });
  });

  describe('queueVendorNotification', () => {
    it('should enqueue vendor notification with HIGHEST priority', async () => {
      const result = await service.queueVendorNotification({
        orderId: 'order-123',
        tenantId: 'tenant-789',
        clientPhoneNumber: '5511988887777',
        paymentProofUrl: 's3://bucket/proof.jpg',
        orderTotal: 162.00,
        orderItems: [],
      });

      expect(result).toHaveProperty('jobId');
      expect(mockNotificationQueue.add).toHaveBeenCalledWith(
        'send-vendor-payment-notification',
        expect.any(Object),
        expect.objectContaining({
          priority: 20, // HIGHEST
          attempts: 3,
        }),
      );
    });
  });

  describe('queueClientStatusNotification', () => {
    it('should enqueue client status notification', async () => {
      const result = await service.queueClientStatusNotification({
        orderId: 'order-123',
        clientPhoneNumber: '5511988887777',
        status: 'CONFIRMED',
        reason: 'Payment approved',
      });

      expect(result).toHaveProperty('jobId');
      expect(mockNotificationQueue.add).toHaveBeenCalledWith(
        'send-client-order-status-notification',
        expect.any(Object),
        expect.objectContaining({
          priority: 15, // HIGH
          attempts: 3,
        }),
      );
    });
  });

  describe('queueCleanupTask', () => {
    it('should enqueue cleanup task', async () => {
      const result = await service.queueCleanupTask('cleanup-tts-cache');

      expect(result).toHaveProperty('jobId');
      expect(mockCleanupQueue.add).toHaveBeenCalledWith(
        'cleanup-tts-cache',
        expect.any(Object),
        expect.objectContaining({
          priority: 1, // LOWEST
        }),
      );
    });

    it('should reject invalid cleanup task', async () => {
      mockCleanupQueue.add.mockRejectedValueOnce(new Error('Invalid task'));

      await expect(
        service.queueCleanupTask('invalid-task'),
      ).rejects.toThrow('Invalid task');
    });
  });

  describe('getQueuesStats', () => {
    it('should return all queues statistics', async () => {
      const stats = await service.getQueuesStats();

      expect(stats).toHaveProperty('audio');
      expect(stats).toHaveProperty('notification');
      expect(stats).toHaveProperty('cleanup');
      expect(stats).toHaveProperty('sync');

      expect(stats.audio.waiting).toBe(2);
      expect(stats.notification.completed).toBe(50);
    });
  });

  describe('getJobStatus', () => {
    it('should return job status details', async () => {
      const status = await service.getJobStatus('audio', 'job-1');

      expect(status).toHaveProperty('found', true);
      expect(status).toHaveProperty('jobId', 'job-1');
      expect(status).toHaveProperty('progress');
      expect(status).toHaveProperty('attempts');
    });

    it('should return not found for non-existent job', async () => {
      mockAudioQueue.getJob.mockResolvedValueOnce(null);

      const status = await service.getJobStatus('audio', 'non-existent');

      expect(status.found).toBe(false);
    });
  });

  describe('clearQueue', () => {
    it('should clear failed jobs from queue', async () => {
      const mockFailedJobs = [
        { id: 'failed-1', remove: jest.fn() },
        { id: 'failed-2', remove: jest.fn() },
      ];

      mockCleanupQueue.getFailed = jest
        .fn()
        .mockResolvedValueOnce(mockFailedJobs);

      const result = await service.clearQueue('cleanup');

      expect(result).toEqual({
        success: true,
        queueName: 'cleanup',
        jobsRemoved: expect.any(Number),
      });
    });
  });
});
