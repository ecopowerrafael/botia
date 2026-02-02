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
var AutomationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
let AutomationService = AutomationService_1 = class AutomationService {
    prisma;
    whatsappService;
    logger = new common_1.Logger(AutomationService_1.name);
    dripCampaigns = new Map();
    constructor(prisma, whatsappService) {
        this.prisma = prisma;
        this.whatsappService = whatsappService;
    }
    async createDripCampaign(dto) {
        const { tenantId, name, description, instanceKey, steps, startDate, repeat } = dto;
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!tenant) {
            throw new common_1.HttpException('Tenant not found', common_1.HttpStatus.NOT_FOUND);
        }
        const instance = await this.prisma.whatsAppInstance.findFirst({
            where: { tenantId, instanceKey },
        });
        if (!instance) {
            throw new common_1.HttpException('WhatsApp instance not found', common_1.HttpStatus.NOT_FOUND);
        }
        const schedule = await this.prisma.schedule.create({
            data: {
                tenantId,
                name,
                type: 'DRIP',
                target: dto.contactId || JSON.stringify(dto.contactPhones || []),
                payload: {
                    instanceKey,
                    steps,
                    description,
                    repeatEnabled: repeat || false,
                },
                runAt: startDate ? new Date(startDate) : new Date(),
                status: 'PENDING',
            },
        });
        this.logger.log(`Drip campaign created: ${schedule.id} for tenant ${tenantId}`);
        if (!startDate) {
            this.scheduleDripCampaign(schedule.id, tenantId, instanceKey, steps, dto.contactId, dto.contactPhones);
        }
        return {
            success: true,
            schedule,
        };
    }
    async createMassCampaign(dto) {
        const { tenantId, name, description, instanceKey, message, contactPhones, delayBetweenMessages = 5000, randomDelayMax = 10000, variables = {} } = dto;
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!tenant) {
            throw new common_1.HttpException('Tenant not found', common_1.HttpStatus.NOT_FOUND);
        }
        const instance = await this.prisma.whatsAppInstance.findFirst({
            where: { tenantId, instanceKey },
        });
        if (!instance) {
            throw new common_1.HttpException('WhatsApp instance not found', common_1.HttpStatus.NOT_FOUND);
        }
        const schedule = await this.prisma.schedule.create({
            data: {
                tenantId,
                name,
                type: 'MASS',
                target: JSON.stringify(contactPhones),
                payload: {
                    instanceKey,
                    message,
                    delayBetweenMessages,
                    randomDelayMax,
                    variables: variables || {},
                    description,
                    sentCount: 0,
                    failedCount: 0,
                },
                runAt: new Date(),
                status: 'PENDING',
            },
        });
        this.logger.log(`Mass campaign created: ${schedule.id} for tenant ${tenantId} with ${contactPhones.length} contacts`);
        this.processMassCampaign(schedule.id, tenantId, instanceKey, message, contactPhones, delayBetweenMessages, randomDelayMax, variables);
        return {
            success: true,
            schedule,
            totalContacts: contactPhones.length,
        };
    }
    scheduleDripCampaign(scheduleId, tenantId, instanceKey, steps, contactId, contactPhones) {
        let stepIndex = 0;
        const timeout = this.processDripStep(scheduleId, tenantId, instanceKey, steps, stepIndex, contactId, contactPhones);
        if (timeout) {
            this.dripCampaigns.set(scheduleId, timeout);
        }
    }
    processDripStep(scheduleId, tenantId, instanceKey, steps, stepIndex, contactId, contactPhones) {
        if (stepIndex >= steps.length) {
            this.logger.log(`Drip campaign completed: ${scheduleId}`);
            this.prisma.schedule.update({
                where: { id: scheduleId },
                data: { status: 'COMPLETED' },
            }).catch((err) => this.logger.error(`Error updating schedule: ${err.message}`));
            return null;
        }
        const currentStep = steps[stepIndex];
        const delayMs = currentStep.delay * 1000;
        const timeout = setTimeout(async () => {
            try {
                let phones = [];
                if (contactId) {
                    const contact = await this.prisma.contact.findUnique({
                        where: { id: contactId },
                    });
                    if (contact) {
                        phones = [contact.phone];
                    }
                }
                else if (contactPhones) {
                    phones = contactPhones;
                }
                for (const phone of phones) {
                    try {
                        await this.whatsappService.sendMessage({
                            tenantId,
                            instanceKey,
                            phoneNumber: phone,
                            message: currentStep.message,
                        });
                    }
                    catch (error) {
                        this.logger.error(`Error sending drip message to ${phone}: ${error.message}`);
                    }
                }
                this.processDripStep(scheduleId, tenantId, instanceKey, steps, stepIndex + 1, contactId, contactPhones);
            }
            catch (error) {
                this.logger.error(`Error processing drip step: ${error.message}`);
            }
        }, delayMs);
        return timeout;
    }
    async processMassCampaign(scheduleId, tenantId, instanceKey, message, contactPhones, delayBetweenMessages, randomDelayMax, variables) {
        let sentCount = 0;
        let failedCount = 0;
        for (let i = 0; i < contactPhones.length; i++) {
            const phone = contactPhones[i];
            const randomDelay = Math.random() * randomDelayMax;
            const totalDelay = i === 0 ? 0 : delayBetweenMessages + randomDelay;
            setTimeout(async () => {
                try {
                    const personalizedMessage = this.personalizeMessage(message, variables);
                    await this.whatsappService.sendMessage({
                        tenantId,
                        instanceKey,
                        phoneNumber: phone,
                        message: personalizedMessage,
                    });
                    sentCount++;
                    this.logger.log(`Mass message sent to ${phone} (${i + 1}/${contactPhones.length})`);
                }
                catch (error) {
                    failedCount++;
                    this.logger.error(`Error sending mass message to ${phone}: ${error.message}`);
                }
                if (i === contactPhones.length - 1) {
                    await this.prisma.schedule.update({
                        where: { id: scheduleId },
                        data: {
                            status: failedCount === 0 ? 'COMPLETED' : 'FAILED',
                            payload: {
                                sentCount,
                                failedCount,
                            },
                        },
                    });
                    this.logger.log(`Mass campaign completed: ${scheduleId} (Sent: ${sentCount}, Failed: ${failedCount})`);
                }
            }, totalDelay);
        }
        await this.prisma.schedule.update({
            where: { id: scheduleId },
            data: { status: 'RUNNING' },
        });
    }
    personalizeMessage(message, variables) {
        let personalizedMessage = message;
        if (variables) {
            Object.entries(variables).forEach(([key, value]) => {
                const placeholder = new RegExp(`{${key}}`, 'g');
                personalizedMessage = personalizedMessage.replace(placeholder, value);
            });
        }
        return personalizedMessage;
    }
    async pauseCampaign(scheduleId) {
        const schedule = await this.prisma.schedule.findUnique({
            where: { id: scheduleId },
        });
        if (!schedule) {
            throw new common_1.HttpException('Campaign not found', common_1.HttpStatus.NOT_FOUND);
        }
        const timeout = this.dripCampaigns.get(scheduleId);
        if (timeout) {
            clearTimeout(timeout);
            this.dripCampaigns.delete(scheduleId);
        }
        await this.prisma.schedule.update({
            where: { id: scheduleId },
            data: { status: 'PAUSED' },
        });
        return { success: true, message: 'Campaign paused' };
    }
    async resumeCampaign(scheduleId) {
        const schedule = await this.prisma.schedule.findUnique({
            where: { id: scheduleId },
        });
        if (!schedule) {
            throw new common_1.HttpException('Campaign not found', common_1.HttpStatus.NOT_FOUND);
        }
        if (schedule.type === 'DRIP') {
            const { instanceKey, steps } = schedule.payload;
            this.scheduleDripCampaign(scheduleId, schedule.tenantId, instanceKey, steps);
        }
        await this.prisma.schedule.update({
            where: { id: scheduleId },
            data: { status: 'ACTIVE' },
        });
        return { success: true, message: 'Campaign resumed' };
    }
    async deleteCampaign(scheduleId) {
        const schedule = await this.prisma.schedule.findUnique({
            where: { id: scheduleId },
        });
        if (!schedule) {
            throw new common_1.HttpException('Campaign not found', common_1.HttpStatus.NOT_FOUND);
        }
        const timeout = this.dripCampaigns.get(scheduleId);
        if (timeout) {
            clearTimeout(timeout);
            this.dripCampaigns.delete(scheduleId);
        }
        await this.prisma.schedule.delete({
            where: { id: scheduleId },
        });
        return { success: true, message: 'Campaign deleted' };
    }
    async listCampaigns(tenantId, type, status) {
        const where = { tenantId };
        if (type) {
            where.type = type.toUpperCase();
        }
        if (status) {
            where.status = status;
        }
        return this.prisma.schedule.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    async getCampaign(scheduleId, tenantId) {
        const schedule = await this.prisma.schedule.findFirst({
            where: { id: scheduleId, tenantId },
        });
        if (!schedule) {
            throw new common_1.HttpException('Campaign not found', common_1.HttpStatus.NOT_FOUND);
        }
        return schedule;
    }
    async getCampaignStats(scheduleId, tenantId) {
        const schedule = await this.prisma.schedule.findFirst({
            where: { id: scheduleId, tenantId },
        });
        if (!schedule) {
            throw new common_1.HttpException('Campaign not found', common_1.HttpStatus.NOT_FOUND);
        }
        const contacts = schedule.type === 'MASS'
            ? JSON.parse(schedule.target || '[]').length
            : 1;
        const { sentCount = 0, failedCount = 0 } = (schedule.payload || {});
        return {
            campaignId: scheduleId,
            type: schedule.type,
            name: schedule.name,
            status: schedule.status,
            totalContacts: contacts,
            sentCount,
            failedCount,
            successRate: contacts > 0 ? ((sentCount / contacts) * 100).toFixed(2) : '0',
            createdAt: schedule.createdAt,
        };
    }
};
exports.AutomationService = AutomationService;
exports.AutomationService = AutomationService = AutomationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        whatsapp_service_1.WhatsAppService])
], AutomationService);
//# sourceMappingURL=automation.service.js.map