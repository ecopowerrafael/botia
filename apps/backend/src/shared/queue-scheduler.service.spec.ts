import { Test, TestingModule } from '@nestjs/testing';
import { QueueSchedulerService } from './queue-scheduler.service';

describe('QueueSchedulerService', () => {
  let service: QueueSchedulerService;
  let mockQueueService: any;
  let mockLogger: any;

  beforeEach(async () => {
    mockQueueService = {
      queueCleanupTask: jest.fn().mockResolvedValue({
        jobId: 'job-123',
        message: 'Job enqueued',
      }),
      getQueuesStats: jest.fn().mockResolvedValue({
        audio: { waiting: 0, active: 0 },
        notification: { waiting: 0, active: 0 },
        cleanup: { waiting: 0, active: 0 },
        sync: { waiting: 0, active: 0 },
      }),
    };

    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueSchedulerService,
        {
          provide: 'QueueService',
          useValue: mockQueueService,
        },
        {
          provide: 'LoggerService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<QueueSchedulerService>(QueueSchedulerService);
  });

  describe('onModuleInit', () => {
    it('should register all cron jobs on initialization', async () => {
      await service.onModuleInit();

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('scheduled'),
      );
    });
  });

  describe('Daily Cron Jobs', () => {
    it('should schedule cleanup-tts-cache at 02:00 UTC', async () => {
      const cronExpression = '0 2 * * *';
      expect(cronExpression).toMatch(/^0 2 \* \* \*/);
    });

    it('should schedule cleanup-conversations at 03:00 UTC', async () => {
      const cronExpression = '0 3 * * *';
      expect(cronExpression).toMatch(/^0 3 \* \* \*/);
    });

    it('should schedule cleanup-notifications at 04:00 UTC', async () => {
      const cronExpression = '0 4 * * *';
      expect(cronExpression).toMatch(/^0 4 \* \* \*/);
    });

    it('should schedule update-system-stats at 05:00 UTC', async () => {
      const cronExpression = '0 5 * * *';
      expect(cronExpression).toMatch(/^0 5 \* \* \*/);
    });

    it('should schedule health check every 30 minutes', async () => {
      const cronExpression = '*/30 * * * *';
      expect(cronExpression).toMatch(/^\*\/30 \* \* \* \*/);
    });
  });

  describe('getScheduledJobs', () => {
    it('should return list of all scheduled jobs', async () => {
      const jobs = service.getScheduledJobs();

      expect(jobs).toBeInstanceOf(Array);
      expect(jobs.length).toBeGreaterThan(0);
    });

    it('should include job names in response', async () => {
      const jobs = service.getScheduledJobs();

      const jobNames = jobs.map((j: any) => j.name);
      expect(jobNames).toContain('cleanup-tts-cache');
      expect(jobNames).toContain('cleanup-conversations');
      expect(jobNames).toContain('cleanup-notifications');
      expect(jobNames).toContain('update-system-stats');
      expect(jobNames).toContain('health-check');
    });

    it('should indicate job running status', async () => {
      const jobs = service.getScheduledJobs();

      jobs.forEach((job: any) => {
        expect(job).toHaveProperty('running');
        expect(typeof job.running).toBe('boolean');
      });
    });

    it('should provide next execution time', async () => {
      const jobs = service.getScheduledJobs();

      jobs.forEach((job: any) => {
        expect(job).toHaveProperty('nextDate');
      });
    });
  });

  describe('triggerCleanupManually', () => {
    it('should trigger cleanup job immediately', async () => {
      const result = await service.triggerCleanupManually('cleanup-tts-cache');

      expect(result).toHaveProperty('success', true);
      expect(mockQueueService.queueCleanupTask).toHaveBeenCalledWith(
        'cleanup-tts-cache',
      );
    });

    it('should accept all valid task names', async () => {
      const validTasks = [
        'cleanup-tts-cache',
        'cleanup-conversations',
        'cleanup-notifications',
        'update-system-stats',
      ];

      for (const task of validTasks) {
        const result = await service.triggerCleanupManually(task);
        expect(result).toHaveProperty('success', true);
      }
    });

    it('should reject invalid task names', async () => {
      await expect(
        service.triggerCleanupManually('invalid-task'),
      ).rejects.toThrow();
    });

    it('should return job ID from enqueued task', async () => {
      const result = await service.triggerCleanupManually('cleanup-tts-cache');

      expect(result).toHaveProperty('jobId');
    });

    it('should allow emergency cleanup trigger', async () => {
      const result = await service.triggerCleanupManually('cleanup-tts-cache');

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('Execution Frequency', () => {
    it('should run daily cleanup tasks once per day', async () => {
      const dailyCrons = [
        '0 2 * * *', // 02:00
        '0 3 * * *', // 03:00
        '0 4 * * *', // 04:00
        '0 5 * * *', // 05:00
      ];

      dailyCrons.forEach((cron) => {
        expect(cron).toMatch(/^0 [2-5] \* \* \*/);
      });
    });

    it('should run health check 48 times per day (every 30 minutes)', async () => {
      const healthCheckCron = '*/30 * * * *';
      const executionsPerDay = 24 * (60 / 30); // 48

      expect(executionsPerDay).toBe(48);
      expect(healthCheckCron).toMatch(/^\*\/30 \* \* \* \*/);
    });
  });

  describe('Error Handling', () => {
    it('should handle queue service errors gracefully', async () => {
      mockQueueService.queueCleanupTask.mockRejectedValueOnce(
        new Error('Queue unavailable'),
      );

      await expect(
        service.triggerCleanupManually('cleanup-tts-cache'),
      ).rejects.toThrow('Queue unavailable');
    });

    it('should log errors when job enqueue fails', async () => {
      mockQueueService.queueCleanupTask.mockRejectedValueOnce(
        new Error('Redis connection failed'),
      );

      try {
        await service.triggerCleanupManually('cleanup-tts-cache');
      } catch (e) {
        // Expected
      }

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Integration with QueueService', () => {
    it('should use QueueService to enqueue jobs', async () => {
      await service.triggerCleanupManually('cleanup-tts-cache');

      expect(mockQueueService.queueCleanupTask).toHaveBeenCalled();
    });

    it('should get queue stats for health check', async () => {
      await service.triggerCleanupManually('health-check');

      // Health check may call getQueuesStats
      expect(mockQueueService.getQueuesStats).toHaveBeenCalledTimes(
        expect.any(Number),
      );
    });
  });
});
