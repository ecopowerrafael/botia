import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../shared/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import {
  CreateDripCampaignDto,
  CreateMassCampaignDto,
  UpdateCampaignStatusDto,
  CampaignStatus,
  CampaignType,
  DripStep,
} from './dto/automation.dto';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);
  private dripCampaigns: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  /**
   * Criar campanha Drip
   */
  async createDripCampaign(dto: CreateDripCampaignDto) {
    const { tenantId, name, description, instanceKey, steps, startDate, repeat } = dto;

    // Validar tenant e instância
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
    }

    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { tenantId, instanceKey },
    });

    if (!instance) {
      throw new HttpException(
        'WhatsApp instance not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Criar registro de agendamento
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
        } as any,
        runAt: startDate ? new Date(startDate) : new Date(),
        status: 'PENDING',
      },
    });

    this.logger.log(`Drip campaign created: ${schedule.id} for tenant ${tenantId}`);

    // Iniciar campanha se startDate não foi especificado
    if (!startDate) {
      this.scheduleDripCampaign(schedule.id, tenantId, instanceKey, steps, dto.contactId, dto.contactPhones);
    }

    return {
      success: true,
      schedule,
    };
  }

  /**
   * Criar campanha em Massa
   */
  async createMassCampaign(dto: CreateMassCampaignDto) {
    const { tenantId, name, description, instanceKey, message, contactPhones, delayBetweenMessages = 5000, randomDelayMax = 10000, variables = {} } = dto;

    // Validar tenant e instância
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
    }

    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { tenantId, instanceKey },
    });

    if (!instance) {
      throw new HttpException(
        'WhatsApp instance not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Criar registro de agendamento
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

    this.logger.log(
      `Mass campaign created: ${schedule.id} for tenant ${tenantId} with ${contactPhones.length} contacts`,
    );

    // Iniciar envio em massa
    this.processMassCampaign(schedule.id, tenantId, instanceKey, message, contactPhones, delayBetweenMessages, randomDelayMax, variables);

    return {
      success: true,
      schedule,
      totalContacts: contactPhones.length,
    };
  }

  /**
   * Agendar campanha Drip
   */
  private scheduleDripCampaign(
    scheduleId: string,
    tenantId: string,
    instanceKey: string,
    steps: DripStep[],
    contactId?: string,
    contactPhones?: string[],
  ) {
    let stepIndex = 0;
    const timeout = this.processDripStep(
      scheduleId,
      tenantId,
      instanceKey,
      steps,
      stepIndex,
      contactId,
      contactPhones,
    );

    if (timeout) {
      this.dripCampaigns.set(scheduleId, timeout);
    }
  }

  /**
   * Processar uma etapa da Drip
   */
  private processDripStep(
    scheduleId: string,
    tenantId: string,
    instanceKey: string,
    steps: DripStep[],
    stepIndex: number,
    contactId?: string,
    contactPhones?: string[],
  ): NodeJS.Timeout | null {
    if (stepIndex >= steps.length) {
      this.logger.log(`Drip campaign completed: ${scheduleId}`);
      this.prisma.schedule.update({
        where: { id: scheduleId },
        data: { status: 'COMPLETED' as any },
      }).catch((err) => this.logger.error(`Error updating schedule: ${err.message}`));
      return null;
    }

    const currentStep = steps[stepIndex];
    const delayMs = currentStep.delay * 1000;

    const timeout = setTimeout(async () => {
      try {
        // Buscar contatos para enviar
        let phones: string[] = [];

        if (contactId) {
          const contact = await this.prisma.contact.findUnique({
            where: { id: contactId },
          });
          if (contact) {
            phones = [contact.phone];
          }
        } else if (contactPhones) {
          phones = contactPhones;
        }

        // Enviar para todos os contatos
        for (const phone of phones) {
          try {
            await this.whatsappService.sendMessage({
              tenantId,
              instanceKey,
              phoneNumber: phone,
              message: currentStep.message,
            });
          } catch (error) {
            this.logger.error(
              `Error sending drip message to ${phone}: ${error.message}`,
            );
          }
        }

        // Agendar próxima etapa
        this.processDripStep(
          scheduleId,
          tenantId,
          instanceKey,
          steps,
          stepIndex + 1,
          contactId,
          contactPhones,
        );
      } catch (error) {
        this.logger.error(
          `Error processing drip step: ${error.message}`,
        );
      }
    }, delayMs);

    return timeout;
  }

  /**
   * Processar campanha em Massa
   */
  private async processMassCampaign(
    scheduleId: string,
    tenantId: string,
    instanceKey: string,
    message: string,
    contactPhones: string[],
    delayBetweenMessages: number,
    randomDelayMax: number,
    variables: Record<string, string>,
  ) {
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < contactPhones.length; i++) {
      const phone = contactPhones[i];

      // Calcular delay com aleatoriedade
      const randomDelay = Math.random() * randomDelayMax;
      const totalDelay = i === 0 ? 0 : delayBetweenMessages + randomDelay;

      setTimeout(async () => {
        try {
          // Personalizar mensagem com variáveis
          const personalizedMessage = this.personalizeMessage(message, variables);

          await this.whatsappService.sendMessage({
            tenantId,
            instanceKey,
            phoneNumber: phone,
            message: personalizedMessage,
          });

          sentCount++;
          this.logger.log(
            `Mass message sent to ${phone} (${i + 1}/${contactPhones.length})`,
          );
        } catch (error) {
          failedCount++;
          this.logger.error(
            `Error sending mass message to ${phone}: ${error.message}`,
          );
        }

        // Atualizar status final
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

          this.logger.log(
            `Mass campaign completed: ${scheduleId} (Sent: ${sentCount}, Failed: ${failedCount})`,
          );
        }
      }, totalDelay);
    }

    // Atualizar status para RUNNING
    await this.prisma.schedule.update({
      where: { id: scheduleId },
      data: { status: 'RUNNING' },
    });
  }

  /**
   * Personalizar mensagem com variáveis
   */
  private personalizeMessage(
    message: string,
    variables: Record<string, string>,
  ): string {
    let personalizedMessage = message;

    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = new RegExp(`{${key}}`, 'g');
        personalizedMessage = personalizedMessage.replace(placeholder, value);
      });
    }

    return personalizedMessage;
  }

  /**
   * Pausar campanha
   */
  async pauseCampaign(scheduleId: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new HttpException('Campaign not found', HttpStatus.NOT_FOUND);
    }

    // Cancelar timeout se estiver agendado
    const timeout = this.dripCampaigns.get(scheduleId);
    if (timeout) {
      clearTimeout(timeout);
      this.dripCampaigns.delete(scheduleId);
    }

    await this.prisma.schedule.update({
      where: { id: scheduleId },
      data: { status: 'PAUSED' as any },
    });

    return { success: true, message: 'Campaign paused' };
  }

  /**
   * Retomar campanha
   */
  async resumeCampaign(scheduleId: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new HttpException('Campaign not found', HttpStatus.NOT_FOUND);
    }

    if (schedule.type === 'DRIP') {
      const { instanceKey, steps } = schedule.payload as any;
      this.scheduleDripCampaign(
        scheduleId,
        schedule.tenantId,
        instanceKey,
        steps,
      );
    }

    await this.prisma.schedule.update({
      where: { id: scheduleId },
      data: { status: 'ACTIVE' as any },
    });

    return { success: true, message: 'Campaign resumed' };
  }

  /**
   * Deletar campanha
   */
  async deleteCampaign(scheduleId: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new HttpException('Campaign not found', HttpStatus.NOT_FOUND);
    }

    // Cancelar timeout
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

  /**
   * Listar campanhas do tenant
   */
  async listCampaigns(tenantId: string, type?: string, status?: string) {
    const where: any = { tenantId };

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

  /**
   * Obter campanha específica
   */
  async getCampaign(scheduleId: string, tenantId: string) {
    const schedule = await this.prisma.schedule.findFirst({
      where: { id: scheduleId, tenantId },
    });

    if (!schedule) {
      throw new HttpException('Campaign not found', HttpStatus.NOT_FOUND);
    }

    return schedule;
  }

  /**
   * Obter estatísticas da campanha
   */
  async getCampaignStats(scheduleId: string, tenantId: string) {
    const schedule = await this.prisma.schedule.findFirst({
      where: { id: scheduleId, tenantId },
    });

    if (!schedule) {
      throw new HttpException('Campaign not found', HttpStatus.NOT_FOUND);
    }

    const contacts = schedule.type === 'MASS'
      ? JSON.parse(schedule.target || '[]').length
      : 1;

    const { sentCount = 0, failedCount = 0 } = (schedule.payload || {}) as any;

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
}
