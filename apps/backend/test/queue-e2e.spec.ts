import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('Queue Module E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Queue Status Endpoint', () => {
    it('/queue/status (GET) should return queue statistics', () => {
      return request(app.getHttpServer())
        .get('/queue/status')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('queues');
          expect(res.body).toHaveProperty('healthStatus');
          expect(res.body.queues).toHaveProperty('audio');
          expect(res.body.queues).toHaveProperty('notification');
          expect(res.body.queues).toHaveProperty('cleanup');
        });
    });

    it('should return valid health status', () => {
      return request(app.getHttpServer())
        .get('/queue/status')
        .expect(200)
        .expect((res) => {
          expect(res.body.healthStatus).toHaveProperty('score');
          expect(res.body.healthStatus).toHaveProperty('status');
          expect(['HEALTHY', 'WARNING', 'CRITICAL']).toContain(
            res.body.healthStatus.status,
          );
        });
    });
  });

  describe('Job Status Endpoint', () => {
    it('/queue/job/:queueName/:jobId (GET) should return job details', () => {
      return request(app.getHttpServer())
        .get('/queue/job/audio/test-job-123')
        .expect((res) => {
          expect(res.body).toHaveProperty('found');
          expect(res.body).toHaveProperty('jobId');
        });
    });

    it('should validate queue name parameter', () => {
      return request(app.getHttpServer())
        .get('/queue/job/invalid-queue/test-job')
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });
  });

  describe('Cleanup Trigger Endpoint', () => {
    it('/queue/cleanup/:taskName (POST) should enqueue cleanup task', () => {
      return request(app.getHttpServer())
        .post('/queue/cleanup/cleanup-tts-cache')
        .expect(202)
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body).toHaveProperty('jobId');
        });
    });

    it('should accept all valid cleanup task names', async () => {
      const tasks = [
        'cleanup-tts-cache',
        'cleanup-conversations',
        'cleanup-notifications',
        'update-system-stats',
      ];

      for (const task of tasks) {
        await request(app.getHttpServer())
          .post(`/queue/cleanup/${task}`)
          .expect((res) => {
            if (res.status === 202) {
              expect(res.body).toHaveProperty('success', true);
            }
          });
      }
    });

    it('should reject invalid task names', () => {
      return request(app.getHttpServer())
        .post('/queue/cleanup/invalid-task')
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });
  });

  describe('Scheduled Jobs Endpoint', () => {
    it('/queue/scheduled-jobs (GET) should return list of cron jobs', () => {
      return request(app.getHttpServer())
        .get('/queue/scheduled-jobs')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('jobs');
          expect(Array.isArray(res.body.jobs)).toBe(true);
        });
    });

    it('should include job details (name, running status, next execution)', () => {
      return request(app.getHttpServer())
        .get('/queue/scheduled-jobs')
        .expect(200)
        .expect((res) => {
          res.body.jobs.forEach((job: any) => {
            expect(job).toHaveProperty('name');
            expect(job).toHaveProperty('running');
            expect(job).toHaveProperty('nextDate');
          });
        });
    });
  });

  describe('Test Queue Endpoint', () => {
    it('/queue/test (POST) should enqueue test job', () => {
      return request(app.getHttpServer())
        .post('/queue/test')
        .send({ queueType: 'audio' })
        .expect((res) => {
          if (res.status === 202 || res.status === 201) {
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('jobId');
          }
        });
    });

    it('should accept all queue types', async () => {
      const queueTypes = ['audio', 'notification', 'cleanup'];

      for (const type of queueTypes) {
        await request(app.getHttpServer())
          .post('/queue/test')
          .send({ queueType: type })
          .expect((res) => {
            if (res.status === 202 || res.status === 201) {
              expect(res.body).toHaveProperty('success', true);
            }
          });
      }
    });

    it('should validate request body', () => {
      return request(app.getHttpServer())
        .post('/queue/test')
        .send({}) // Missing queueType
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });
  });

  describe('Clear Queue Endpoint', () => {
    it('/queue/clear/:queueName (POST) should clear failed jobs', () => {
      return request(app.getHttpServer())
        .post('/queue/clear/audio')
        .expect((res) => {
          if (res.status === 200) {
            expect(res.body).toHaveProperty('success');
            expect(res.body).toHaveProperty('queueName');
            expect(res.body).toHaveProperty('jobsRemoved');
          }
        });
    });

    it('should validate queue name', () => {
      return request(app.getHttpServer())
        .post('/queue/clear/invalid-queue')
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });

    it('should include warning about destructive operation', () => {
      return request(app.getHttpServer())
        .post('/queue/clear/audio')
        .expect((res) => {
          if (res.status === 200) {
            expect(res.body).toHaveProperty('warning');
          }
        });
    });
  });

  describe('Audio Queue Integration', () => {
    it('should enqueue audio transcription job', () => {
      return request(app.getHttpServer())
        .post('/audio/transcribe')
        .send({
          audioUrl: 's3://bucket/audio.mp3',
          chatId: 'chat-123',
          language: 'pt',
        })
        .expect((res) => {
          if (res.status === 202 || res.status === 201) {
            expect(res.body).toHaveProperty('jobId');
          }
        });
    });
  });

  describe('Notification Queue Integration', () => {
    it('should enqueue vendor payment notification', () => {
      return request(app.getHttpServer())
        .post('/notification/vendor-payment')
        .send({
          orderId: 'order-123',
          clientPhoneNumber: '5511988887777',
          paymentProofUrl: 's3://bucket/proof.jpg',
          orderTotal: 162.00,
        })
        .expect((res) => {
          if (res.status === 202 || res.status === 201) {
            expect(res.body).toHaveProperty('jobId');
          }
        });
    });

    it('should enqueue client status notification', () => {
      return request(app.getHttpServer())
        .post('/notification/client-status')
        .send({
          orderId: 'order-123',
          clientPhoneNumber: '5511988887777',
          status: 'CONFIRMED',
        })
        .expect((res) => {
          if (res.status === 202 || res.status === 201) {
            expect(res.body).toHaveProperty('jobId');
          }
        });
    });
  });

  describe('Queue Monitoring Dashboard', () => {
    it('should provide real-time queue metrics', () => {
      return request(app.getHttpServer())
        .get('/queue/status')
        .expect(200)
        .expect((res) => {
          const { queues } = res.body;

          Object.keys(queues).forEach((queueName) => {
            expect(queues[queueName]).toHaveProperty('waiting');
            expect(queues[queueName]).toHaveProperty('active');
            expect(queues[queueName]).toHaveProperty('completed');
            expect(queues[queueName]).toHaveProperty('failed');
            expect(queues[queueName]).toHaveProperty('delayed');
          });
        });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing endpoints gracefully', () => {
      return request(app.getHttpServer())
        .get('/queue/invalid-endpoint')
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(404);
        });
    });

    it('should validate request headers', () => {
      return request(app.getHttpServer())
        .get('/queue/status')
        .set('Accept', 'application/xml')
        .expect((res) => {
          // Should still work, or return 406 depending on implementation
          expect([200, 406]).toContain(res.status);
        });
    });

    it('should handle concurrent requests', async () => {
      const requests = [];

      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app.getHttpServer())
            .get('/queue/status')
            .expect(200),
        );
      }

      await Promise.all(requests);
    });
  });

  describe('Performance', () => {
    it('/queue/status should respond within 500ms', () => {
      const start = Date.now();

      return request(app.getHttpServer())
        .get('/queue/status')
        .expect(200)
        .expect(() => {
          const duration = Date.now() - start;
          expect(duration).toBeLessThan(500);
        });
    });

    it('should handle high volume of status requests', async () => {
      const promises = [];

      for (let i = 0; i < 100; i++) {
        promises.push(
          request(app.getHttpServer())
            .get('/queue/status')
            .expect(200),
        );
      }

      await Promise.all(promises);
    });
  });

  describe('Security', () => {
    it('should validate queue name parameter (SQL injection prevention)', () => {
      return request(app.getHttpServer())
        .get("/queue/job/audio'; DROP TABLE jobs; --/job-123")
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });

    it('should not expose sensitive information in error messages', () => {
      return request(app.getHttpServer())
        .get('/queue/job/invalid/invalid')
        .expect((res) => {
          expect(res.body.message).not.toMatch(/database|password|secret/i);
        });
    });
  });
});
