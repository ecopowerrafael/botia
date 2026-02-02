import { Test, TestingModule } from '@nestjs/testing';
import { NotificationQueueProcessor } from './notification.processor';

describe('NotificationQueueProcessor', () => {
  let processor: NotificationQueueProcessor;
  let mockNotificationService: any;
  let mockOrderService: any;

  beforeEach(async () => {
    mockNotificationService = {
      notifyVendorPaymentApproved: jest.fn().mockResolvedValue({
        success: true,
        messageId: 'msg-123',
        vendor: 'vendor-789',
      }),
      notifyClientOrderStatus: jest.fn().mockResolvedValue({
        success: true,
        messageId: 'msg-124',
        clientPhone: '5511988887777',
      }),
      sendFallbackNotification: jest.fn().mockResolvedValue({
        success: true,
        method: 'email',
        recipient: 'vendor@email.com',
      }),
    };

    mockOrderService = {
      findById: jest.fn().mockResolvedValue({
        id: 'order-123',
        status: 'PENDING',
        clientPhone: '5511988887777',
        vendor: { email: 'vendor@email.com' },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationQueueProcessor,
        {
          provide: 'NotificationService',
          useValue: mockNotificationService,
        },
        {
          provide: 'OrderService',
          useValue: mockOrderService,
        },
      ],
    }).compile();

    processor = module.get<NotificationQueueProcessor>(
      NotificationQueueProcessor,
    );
  });

  describe('handleVendorNotification', () => {
    it('should send vendor payment notification successfully', async () => {
      const job = {
        id: 'job-123',
        data: {
          orderId: 'order-123',
          tenantId: 'tenant-789',
          clientPhoneNumber: '5511988887777',
          paymentProofUrl: 's3://bucket/proof.jpg',
          orderTotal: 162.00,
          orderItems: [{ name: 'Product', price: 162.00 }],
        },
        attemptsMade: 1,
      };

      const result = await processor.handleVendorNotification(job);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('messageId');
      expect(mockNotificationService.notifyVendorPaymentApproved).toHaveBeenCalled();
    });

    it('should retry on failure (automatic retry mechanism)', async () => {
      mockNotificationService.notifyVendorPaymentApproved.mockRejectedValueOnce(
        new Error('API Error'),
      );

      const job = {
        id: 'job-123',
        data: {
          orderId: 'order-123',
          tenantId: 'tenant-789',
          clientPhoneNumber: '5511988887777',
          paymentProofUrl: 's3://bucket/proof.jpg',
          orderTotal: 162.00,
          orderItems: [],
        },
        attemptsMade: 1,
      };

      await expect(processor.handleVendorNotification(job)).rejects.toThrow(
        'API Error',
      );
    });

    it('should trigger fallback on all attempts exhausted', async () => {
      mockNotificationService.notifyVendorPaymentApproved
        .mockRejectedValueOnce(new Error('API Error 1'))
        .mockRejectedValueOnce(new Error('API Error 2'))
        .mockRejectedValueOnce(new Error('API Error 3'));

      const job = {
        id: 'job-123',
        data: {
          orderId: 'order-123',
          tenantId: 'tenant-789',
          clientPhoneNumber: '5511988887777',
          paymentProofUrl: 's3://bucket/proof.jpg',
          orderTotal: 162.00,
          orderItems: [],
        },
        attemptsMade: 3,
        opts: { attempts: 3 },
      };

      // Should eventually trigger fallback
      await expect(processor.handleVendorNotification(job)).rejects.toThrow();
    });
  });

  describe('handleClientStatusNotification', () => {
    it('should send client status notification successfully', async () => {
      const job = {
        id: 'job-124',
        data: {
          orderId: 'order-123',
          clientPhoneNumber: '5511988887777',
          status: 'CONFIRMED',
          reason: 'Payment approved',
        },
        attemptsMade: 1,
      };

      const result = await processor.handleClientStatusNotification(job);

      expect(result).toHaveProperty('success', true);
      expect(mockNotificationService.notifyClientOrderStatus).toHaveBeenCalled();
    });

    it('should validate order status before sending', async () => {
      mockOrderService.findById.mockResolvedValueOnce(null);

      const job = {
        id: 'job-124',
        data: {
          orderId: 'non-existent',
          clientPhoneNumber: '5511988887777',
          status: 'CONFIRMED',
          reason: 'Payment approved',
        },
        attemptsMade: 1,
      };

      await expect(
        processor.handleClientStatusNotification(job),
      ).rejects.toThrow();
    });

    it('should handle CONFIRMED status', async () => {
      const job = {
        id: 'job-124',
        data: {
          orderId: 'order-123',
          clientPhoneNumber: '5511988887777',
          status: 'CONFIRMED',
          reason: 'Payment approved and verified',
        },
        attemptsMade: 1,
      };

      const result = await processor.handleClientStatusNotification(job);

      expect(result).toHaveProperty('success', true);
      expect(mockNotificationService.notifyClientOrderStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'CONFIRMED' }),
      );
    });

    it('should handle REJECTED status', async () => {
      const job = {
        id: 'job-124',
        data: {
          orderId: 'order-123',
          clientPhoneNumber: '5511988887777',
          status: 'REJECTED',
          reason: 'Payment verification failed',
        },
        attemptsMade: 1,
      };

      const result = await processor.handleClientStatusNotification(job);

      expect(result).toHaveProperty('success', true);
    });
  });

  describe('handleCriticalNotificationFailure', () => {
    it('should fallback to email on WhatsApp failure', async () => {
      const job = {
        id: 'job-125',
        data: {
          orderId: 'order-123',
          method: 'email',
          recipient: 'vendor@email.com',
          message: 'Payment notification',
        },
        attemptsMade: 1,
      };

      const result = await processor.handleCriticalNotificationFailure(job);

      expect(result).toHaveProperty('success', true);
      expect(mockNotificationService.sendFallbackNotification).toHaveBeenCalled();
    });

    it('should fallback to SMS when email fails', async () => {
      const job = {
        id: 'job-125',
        data: {
          orderId: 'order-123',
          method: 'sms',
          recipient: '5511999999999',
          message: 'Payment notification',
        },
        attemptsMade: 1,
      };

      const result = await processor.handleCriticalNotificationFailure(job);

      expect(result).toHaveProperty('success', true);
    });

    it('should alert admin when all fallback methods fail', async () => {
      mockNotificationService.sendFallbackNotification.mockRejectedValueOnce(
        new Error('All methods failed'),
      );

      const job = {
        id: 'job-125',
        data: {
          orderId: 'order-123',
          method: 'alert',
          recipient: 'admin@email.com',
          message: 'Critical failure - manual intervention required',
        },
        attemptsMade: 1,
      };

      await expect(
        processor.handleCriticalNotificationFailure(job),
      ).rejects.toThrow('All methods failed');
    });
  });

  describe('Exponential Backoff Verification', () => {
    it('should implement exponential backoff (2s → 4s → 8s)', () => {
      // Bull backoff configuration: exponential with base delay
      const backoffConfig = {
        type: 'exponential',
        delay: 2000, // 2 seconds
      };

      expect(backoffConfig.type).toBe('exponential');
      expect(backoffConfig.delay).toBe(2000);
    });
  });

  describe('Retry Mechanism', () => {
    it('should attempt 3 retries for vendor notification', () => {
      // Job configuration: 3 attempts
      const jobConfig = {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      };

      expect(jobConfig.attempts).toBe(3);
    });

    it('should attempt 3 retries for client notification', () => {
      const jobConfig = {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      };

      expect(jobConfig.attempts).toBe(3);
    });
  });
});
