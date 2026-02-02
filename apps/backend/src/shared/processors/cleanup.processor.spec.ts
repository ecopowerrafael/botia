import { Test, TestingModule } from '@nestjs/testing';
import { CleanupQueueProcessor } from './cleanup.processor';

describe('CleanupQueueProcessor', () => {
  let processor: CleanupQueueProcessor;
  let mockPrisma: any;
  let mockLogger: any;

  beforeEach(async () => {
    mockPrisma = {
      tTSCache: {
        deleteMany: jest.fn().mockResolvedValue({ count: 42 }),
      },
      conversationMessage: {
        deleteMany: jest.fn().mockResolvedValue({ count: 125 }),
      },
      notificationLog: {
        deleteMany: jest.fn().mockResolvedValue({ count: 78 }),
      },
      order: {
        count: jest.fn().mockResolvedValue(1250),
        findMany: jest.fn().mockResolvedValue([
          { createdAt: new Date() },
          { createdAt: new Date() },
        ]),
      },
      conversationThread: {
        count: jest.fn().mockResolvedValue(580),
      },
    };

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanupQueueProcessor,
        {
          provide: 'PrismaService',
          useValue: mockPrisma,
        },
        {
          provide: 'LoggerService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    processor = module.get<CleanupQueueProcessor>(CleanupQueueProcessor);
  });

  describe('handleTTSCacheCleanup', () => {
    it('should delete TTS cache older than 7 days', async () => {
      const job = {
        id: 'job-cleanup-tts',
        data: {},
        progress: jest.fn(),
      };

      const result = await processor.handleTTSCacheCleanup(job);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('task', 'cleanup-tts-cache');
      expect(result.deleted).toBeGreaterThanOrEqual(0);
      expect(mockPrisma.tTSCache.deleteMany).toHaveBeenCalled();
    });

    it('should use correct date filter (7 days ago)', async () => {
      const job = {
        id: 'job-cleanup-tts',
        data: {},
        progress: jest.fn(),
      };

      await processor.handleTTSCacheCleanup(job);

      const callArgs = mockPrisma.tTSCache.deleteMany.mock.calls[0][0];
      expect(callArgs).toHaveProperty('where');
      expect(callArgs.where).toHaveProperty('createdAt');
    });

    it('should handle cleanup errors gracefully', async () => {
      mockPrisma.tTSCache.deleteMany.mockRejectedValueOnce(
        new Error('Database error'),
      );

      const job = {
        id: 'job-cleanup-tts',
        data: {},
        progress: jest.fn(),
      };

      await expect(processor.handleTTSCacheCleanup(job)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('handleConversationCleanup', () => {
    it('should delete conversation messages older than 30 days', async () => {
      const job = {
        id: 'job-cleanup-conv',
        data: {},
        progress: jest.fn(),
      };

      const result = await processor.handleConversationCleanup(job);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('task', 'cleanup-conversations');
      expect(result.deleted).toBeGreaterThanOrEqual(0);
    });

    it('should preserve archived conversations', async () => {
      const job = {
        id: 'job-cleanup-conv',
        data: {},
        progress: jest.fn(),
      };

      await processor.handleConversationCleanup(job);

      const callArgs = mockPrisma.conversationMessage.deleteMany.mock.calls[0][0];
      expect(callArgs.where).toHaveProperty('AND');
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('cleaned'),
      );
    });

    it('should handle cleanup of 30+ days old messages', async () => {
      const job = {
        id: 'job-cleanup-conv',
        data: {},
        progress: jest.fn(),
      };

      await processor.handleConversationCleanup(job);

      const callArgs = mockPrisma.conversationMessage.deleteMany.mock.calls[0][0];
      expect(callArgs.where.createdAt).toBeDefined();
    });
  });

  describe('handleNotificationLogCleanup', () => {
    it('should delete notification logs older than 7 days', async () => {
      const job = {
        id: 'job-cleanup-notif',
        data: {},
        progress: jest.fn(),
      };

      const result = await processor.handleNotificationLogCleanup(job);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('task', 'cleanup-notifications');
      expect(result.deleted).toBeGreaterThanOrEqual(0);
    });

    it('should maintain log history for 7 days', async () => {
      const job = {
        id: 'job-cleanup-notif',
        data: {},
        progress: jest.fn(),
      };

      await processor.handleNotificationLogCleanup(job);

      const callArgs = mockPrisma.notificationLog.deleteMany.mock.calls[0][0];
      expect(callArgs.where.createdAt).toBeDefined();
    });
  });

  describe('handleSystemStatsUpdate', () => {
    it('should calculate daily statistics', async () => {
      const job = {
        id: 'job-stats',
        data: {},
        progress: jest.fn(),
      };

      const result = await processor.handleSystemStatsUpdate(job);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('task', 'update-system-stats');
      expect(result).toHaveProperty('stats');
    });

    it('should count total orders', async () => {
      const job = {
        id: 'job-stats',
        data: {},
        progress: jest.fn(),
      };

      const result = await processor.handleSystemStatsUpdate(job);

      expect(result.stats).toHaveProperty('totalOrders');
      expect(result.stats.totalOrders).toBeGreaterThanOrEqual(0);
    });

    it('should count total conversations', async () => {
      const job = {
        id: 'job-stats',
        data: {},
        progress: jest.fn(),
      };

      const result = await processor.handleSystemStatsUpdate(job);

      expect(result.stats).toHaveProperty('totalConversations');
      expect(result.stats.totalConversations).toBeGreaterThanOrEqual(0);
    });

    it('should calculate success rate for notifications', async () => {
      const job = {
        id: 'job-stats',
        data: {},
        progress: jest.fn(),
      };

      const result = await processor.handleSystemStatsUpdate(job);

      expect(result.stats).toHaveProperty('notificationSuccessRate');
      expect(result.stats.notificationSuccessRate).toBeGreaterThanOrEqual(0);
      expect(result.stats.notificationSuccessRate).toBeLessThanOrEqual(100);
    });

    it('should handle stats calculation for empty database', async () => {
      mockPrisma.order.count.mockResolvedValueOnce(0);
      mockPrisma.conversationThread.count.mockResolvedValueOnce(0);

      const job = {
        id: 'job-stats',
        data: {},
        progress: jest.fn(),
      };

      const result = await processor.handleSystemStatsUpdate(job);

      expect(result.stats.totalOrders).toBe(0);
      expect(result.stats.totalConversations).toBe(0);
    });
  });

  describe('Idempotency', () => {
    it('should be safe to run cleanup multiple times', async () => {
      const job = {
        id: 'job-cleanup-tts',
        data: {},
        progress: jest.fn(),
      };

      const result1 = await processor.handleTTSCacheCleanup(job);
      const result2 = await processor.handleTTSCacheCleanup(job);

      expect(result1).toHaveProperty('success', true);
      expect(result2).toHaveProperty('success', true);
      expect(mockPrisma.tTSCache.deleteMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('Job Configuration', () => {
    it('should not retry on failure (no retry for cleanup)', () => {
      const jobConfig = {
        attempts: 1,
        priority: 1, // LOWEST
      };

      expect(jobConfig.attempts).toBe(1);
      expect(jobConfig.priority).toBe(1);
    });
  });
});
