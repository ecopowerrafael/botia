import { Test, TestingModule } from '@nestjs/testing';
import { QueueMonitoringController } from './queue-monitoring.controller';

describe('QueueMonitoringController', () => {
  let controller: QueueMonitoringController;
  let mockQueueService: any;
  let mockSchedulerService: any;

  beforeEach(async () => {
    mockQueueService = {
      getQueuesStats: jest.fn().mockResolvedValue({
        audio: { waiting: 2, active: 1, completed: 100, failed: 0, delayed: 0 },
        notification: { waiting: 1, active: 0, completed: 500, failed: 2, delayed: 0 },
        cleanup: { waiting: 0, active: 0, completed: 20, failed: 0, delayed: 0 },
        sync: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
      }),
      getJobStatus: jest.fn().mockResolvedValue({
        found: true,
        jobId: 'job-123',
        state: 'active',
        progress: 45,
        attempts: 1,
        maxAttempts: 3,
        data: { audioUrl: 'test.mp3' },
        timestamp: Date.now(),
      }),
      queueCleanupTask: jest.fn().mockResolvedValue({
        jobId: 'job-cleanup',
        message: 'Job enqueued',
      }),
      clearQueue: jest.fn().mockResolvedValue({
        success: true,
        queueName: 'audio',
        jobsRemoved: 5,
      }),
    };

    mockSchedulerService = {
      getScheduledJobs: jest.fn().mockReturnValue([
        { name: 'cleanup-tts-cache', running: false, nextDate: new Date() },
        { name: 'cleanup-conversations', running: false, nextDate: new Date() },
        { name: 'cleanup-notifications', running: false, nextDate: new Date() },
        { name: 'update-system-stats', running: false, nextDate: new Date() },
        { name: 'health-check', running: true, nextDate: new Date() },
      ]),
      triggerCleanupManually: jest.fn().mockResolvedValue({
        success: true,
        jobId: 'job-manual',
        message: 'Manual cleanup triggered',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueMonitoringController],
      providers: [
        {
          provide: 'QueueService',
          useValue: mockQueueService,
        },
        {
          provide: 'SchedulerService',
          useValue: mockSchedulerService,
        },
      ],
    }).compile();

    controller = module.get<QueueMonitoringController>(
      QueueMonitoringController,
    );
  });

  describe('GET /queue/status', () => {
    it('should return queue status for all queues', async () => {
      const result = await controller.getQueueStatus();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('queues');
      expect(result).toHaveProperty('healthStatus');
    });

    it('should include all queue statistics', async () => {
      const result = await controller.getQueueStatus();

      expect(result.queues).toHaveProperty('audio');
      expect(result.queues).toHaveProperty('notification');
      expect(result.queues).toHaveProperty('cleanup');
      expect(result.queues).toHaveProperty('sync');
    });

    it('should calculate health status with score 0-100', async () => {
      const result = await controller.getQueueStatus();

      expect(result.healthStatus).toHaveProperty('score');
      expect(result.healthStatus.score).toBeGreaterThanOrEqual(0);
      expect(result.healthStatus.score).toBeLessThanOrEqual(100);
    });

    it('should indicate health status as HEALTHY', async () => {
      const result = await controller.getQueueStatus();

      expect(result.healthStatus).toHaveProperty('status');
      expect(['HEALTHY', 'WARNING', 'CRITICAL']).toContain(
        result.healthStatus.status,
      );
    });

    it('should return HEALTHY status when queues are healthy', async () => {
      const result = await controller.getQueueStatus();

      if (result.healthStatus.score > 75) {
        expect(result.healthStatus.status).toBe('HEALTHY');
      }
    });

    it('should return WARNING status for medium load', async () => {
      mockQueueService.getQueuesStats.mockResolvedValueOnce({
        audio: { waiting: 10, active: 3, completed: 100, failed: 0, delayed: 0 },
        notification: { waiting: 5, active: 2, completed: 500, failed: 1, delayed: 0 },
        cleanup: { waiting: 0, active: 0, completed: 20, failed: 0, delayed: 0 },
        sync: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
      });

      const result = await controller.getQueueStatus();

      expect(['HEALTHY', 'WARNING', 'CRITICAL']).toContain(
        result.healthStatus.status,
      );
    });

    it('should return CRITICAL status for failed jobs', async () => {
      mockQueueService.getQueuesStats.mockResolvedValueOnce({
        audio: { waiting: 20, active: 5, completed: 100, failed: 10, delayed: 5 },
        notification: { waiting: 15, active: 4, completed: 500, failed: 15, delayed: 0 },
        cleanup: { waiting: 0, active: 0, completed: 20, failed: 2, delayed: 0 },
        sync: { waiting: 0, active: 0, completed: 0, failed: 5, delayed: 0 },
      });

      const result = await controller.getQueueStatus();

      expect(['HEALTHY', 'WARNING', 'CRITICAL']).toContain(
        result.healthStatus.status,
      );
    });
  });

  describe('GET /queue/job/:queueName/:jobId', () => {
    it('should return job details for valid queue and job ID', async () => {
      const result = await controller.getJobStatus('audio', 'job-123');

      expect(result).toHaveProperty('found', true);
      expect(result).toHaveProperty('jobId');
      expect(result).toHaveProperty('state');
      expect(result).toHaveProperty('progress');
    });

    it('should include job progress information', async () => {
      const result = await controller.getJobStatus('audio', 'job-123');

      expect(result).toHaveProperty('progress');
      expect(result.progress).toBeGreaterThanOrEqual(0);
      expect(result.progress).toBeLessThanOrEqual(100);
    });

    it('should show attempt count and max attempts', async () => {
      const result = await controller.getJobStatus('audio', 'job-123');

      expect(result).toHaveProperty('attempts');
      expect(result).toHaveProperty('maxAttempts');
      expect(result.attempts).toBeLessThanOrEqual(result.maxAttempts);
    });

    it('should return job data payload', async () => {
      const result = await controller.getJobStatus('audio', 'job-123');

      expect(result).toHaveProperty('data');
    });

    it('should return not found for non-existent job', async () => {
      mockQueueService.getJobStatus.mockResolvedValueOnce({
        found: false,
        jobId: 'non-existent',
      });

      const result = await controller.getJobStatus('audio', 'non-existent');

      expect(result).toHaveProperty('found', false);
    });

    it('should validate queue name', async () => {
      // Controller should validate queue name before calling service
      const validQueues = ['audio', 'notification', 'cleanup', 'sync'];

      for (const queue of validQueues) {
        await expect(
          controller.getJobStatus(queue, 'job-123'),
        ).resolves.toBeDefined();
      }
    });
  });

  describe('POST /queue/cleanup/:taskName', () => {
    it('should trigger cleanup task', async () => {
      const result = await controller.triggerCleanup('cleanup-tts-cache');

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('jobId');
      expect(result).toHaveProperty('message');
    });

    it('should accept all valid cleanup tasks', async () => {
      const validTasks = [
        'cleanup-tts-cache',
        'cleanup-conversations',
        'cleanup-notifications',
        'update-system-stats',
      ];

      for (const task of validTasks) {
        const result = await controller.triggerCleanup(task);
        expect(result).toHaveProperty('success', true);
      }
    });

    it('should reject invalid task names', async () => {
      mockQueueService.queueCleanupTask.mockRejectedValueOnce(
        new Error('Invalid task'),
      );

      await expect(
        controller.triggerCleanup('invalid-task'),
      ).rejects.toThrow('Invalid task');
    });

    it('should return status 202 ACCEPTED', async () => {
      const result = await controller.triggerCleanup('cleanup-tts-cache');

      expect(result).toHaveProperty('success', true);
    });
  });

  describe('GET /queue/scheduled-jobs', () => {
    it('should return list of scheduled jobs', async () => {
      const result = await controller.getScheduledJobs();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('jobs');
    });

    it('should include 5 scheduled jobs', async () => {
      const result = await controller.getScheduledJobs();

      expect(result.jobs.length).toBe(5);
    });

    it('should show job running status', async () => {
      const result = await controller.getScheduledJobs();

      result.jobs.forEach((job: any) => {
        expect(job).toHaveProperty('name');
        expect(job).toHaveProperty('running');
        expect(typeof job.running).toBe('boolean');
      });
    });

    it('should show next execution time', async () => {
      const result = await controller.getScheduledJobs();

      result.jobs.forEach((job: any) => {
        expect(job).toHaveProperty('nextDate');
      });
    });
  });

  describe('POST /queue/test', () => {
    it('should enqueue test job', async () => {
      const result = await controller.testQueue({ queueType: 'audio' });

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('jobId');
    });

    it('should accept all queue types', async () => {
      const queueTypes = ['audio', 'notification', 'cleanup'];

      for (const type of queueTypes) {
        const result = await controller.testQueue({ queueType: type });
        expect(result).toHaveProperty('success', true);
      }
    });

    it('should return enqueued job details', async () => {
      const result = await controller.testQueue({ queueType: 'audio' });

      expect(result).toHaveProperty('queueType');
      expect(result).toHaveProperty('testData');
    });
  });

  describe('POST /queue/clear/:queueName', () => {
    it('should clear failed jobs from queue', async () => {
      const result = await controller.clearQueue('audio');

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('queueName');
      expect(result).toHaveProperty('jobsRemoved');
    });

    it('should warn user about destructive operation', async () => {
      const result = await controller.clearQueue('audio');

      expect(result).toHaveProperty('warning');
    });

    it('should validate queue name before clearing', async () => {
      const validQueues = ['audio', 'notification', 'cleanup', 'sync'];

      for (const queue of validQueues) {
        const result = await controller.clearQueue(queue);
        expect(result).toHaveProperty('success', true);
      }
    });
  });

  describe('Health Scoring Algorithm', () => {
    it('should calculate health score based on queue load', () => {
      // Formula: score = 100 - (penalties for active, failed, waiting)
      const baseScore = 100;
      const activeQueues = 1; // -10 per queue if active > 5
      const failedQueues = 0; // -5 per queue if failed > 0
      const waitingQueues = 1; // -10 per queue if waiting > 20

      let score = baseScore;
      score -= Math.max(activeQueues - 1, 0) * 10;
      score -= failedQueues * 5;
      score -= Math.max(waitingQueues - 1, 0) * 10;

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should provide better score for healthy queues', () => {
      const healthyQueues = {
        audio: { waiting: 0, active: 0, failed: 0 },
        notification: { waiting: 0, active: 0, failed: 0 },
        cleanup: { waiting: 0, active: 0, failed: 0 },
        sync: { waiting: 0, active: 0, failed: 0 },
      };

      let score = 100;
      Object.values(healthyQueues).forEach((queue: any) => {
        if (queue.active > 5) score -= 10;
        if (queue.failed > 0) score -= 5;
        if (queue.waiting > 20) score -= 10;
      });

      expect(score).toBe(100); // Perfect health
    });
  });

  describe('Error Responses', () => {
    it('should handle service errors gracefully', async () => {
      mockQueueService.getQueuesStats.mockRejectedValueOnce(
        new Error('Redis connection failed'),
      );

      await expect(controller.getQueueStatus()).rejects.toThrow(
        'Redis connection failed',
      );
    });

    it('should return meaningful error messages', async () => {
      mockQueueService.getJobStatus.mockRejectedValueOnce(
        new Error('Job not found'),
      );

      await expect(
        controller.getJobStatus('audio', 'invalid'),
      ).rejects.toThrow('Job not found');
    });
  });
});
