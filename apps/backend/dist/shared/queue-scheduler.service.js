"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var QueueSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const cron_1 = require("cron");
const bullmq_1 = require("bullmq");
const bullmq_2 = require("@nestjs/bullmq");
let QueueSchedulerService = QueueSchedulerService_1 = class QueueSchedulerService {
    schedulerRegistry;
    cleanupQueue;
    logger = new common_1.Logger(QueueSchedulerService_1.name);
    constructor(schedulerRegistry, cleanupQueue) {
        this.schedulerRegistry = schedulerRegistry;
        this.cleanupQueue = cleanupQueue;
    }
    onModuleInit() {
        this.scheduleCleanupJobs();
        this.logger.log('✅ Scheduled jobs registrados com sucesso');
    }
    scheduleCleanupJobs() {
        this.scheduleCronJob('cleanup-tts-cache', '0 2 * * *', async () => {
            this.logger.log('⏰ Agendamento: Iniciando limpeza TTS cache');
            await this.cleanupQueue.add('cleanup-tts-cache', {}, {
                jobId: `tts-cleanup-${Date.now()}`,
                removeOnComplete: true,
            });
        });
        this.scheduleCronJob('cleanup-conversations', '0 3 * * *', async () => {
            this.logger.log('⏰ Agendamento: Iniciando limpeza de conversas antigas');
            await this.cleanupQueue.add('cleanup-old-conversations', {}, {
                jobId: `conv-cleanup-${Date.now()}`,
                removeOnComplete: true,
            });
        });
        this.scheduleCronJob('cleanup-notification-logs', '0 4 * * *', async () => {
            this.logger.log('⏰ Agendamento: Iniciando limpeza de logs de notificação');
            await this.cleanupQueue.add('cleanup-old-notifications', {}, {
                jobId: `notif-cleanup-${Date.now()}`,
                removeOnComplete: true,
            });
        });
        this.scheduleCronJob('update-system-stats', '0 5 * * *', async () => {
            this.logger.log('⏰ Agendamento: Atualizando estatísticas do sistema');
            await this.cleanupQueue.add('update-system-stats', {}, {
                jobId: `stats-update-${Date.now()}`,
                removeOnComplete: true,
            });
        });
        this.scheduleCronJob('health-check', '*/30 * * * *', async () => {
        });
    }
    scheduleCronJob(name, cronExpression, callback) {
        const job = new cron_1.CronJob(cronExpression, callback, null, true, 'UTC');
        this.schedulerRegistry.addCronJob(name, job);
        this.logger.log(`✅ Job agendado: ${name} (cron: "${cronExpression}")`);
    }
    getScheduledJobs() {
        const jobs = this.schedulerRegistry.getCronJobs();
        const jobNames = Array.from(jobs.keys());
        return {
            total: jobNames.length,
            jobs: jobNames.map((name) => {
                const job = jobs.get(name);
                return {
                    name,
                    running: job?.running || false,
                    nextDate: job?.nextDate?.().toISOString?.() || null,
                };
            }),
        };
    }
    async triggerCleanupManually(jobName) {
        this.logger.log(`🔄 Executando manualmente: ${jobName}`);
        try {
            await this.cleanupQueue.add(jobName, {}, {
                jobId: `manual-${jobName}-${Date.now()}`,
                removeOnComplete: true,
            });
            return {
                success: true,
                message: `Job '${jobName}' adicionado à fila`,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
};
exports.QueueSchedulerService = QueueSchedulerService;
exports.QueueSchedulerService = QueueSchedulerService = QueueSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_2.InjectQueue)('cleanup')),
    __metadata("design:paramtypes", [schedule_1.SchedulerRegistry,
        bullmq_1.Queue])
], QueueSchedulerService);
//# sourceMappingURL=queue-scheduler.service.js.map