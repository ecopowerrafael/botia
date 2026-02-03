import { OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Queue } from 'bullmq';
export declare class QueueSchedulerService implements OnModuleInit {
    private schedulerRegistry;
    private cleanupQueue;
    private readonly logger;
    constructor(schedulerRegistry: SchedulerRegistry, cleanupQueue: Queue);
    onModuleInit(): void;
    private scheduleCleanupJobs;
    private scheduleCronJob;
    getScheduledJobs(): {
        total: number;
        jobs: {
            name: string;
            running: any;
            nextDate: any;
        }[];
    };
    triggerCleanupManually(jobName: string): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
}
