import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { IAService } from '../ia/ia.service';
import axios, { AxiosInstance } from 'axios';
import {
  CreateInstanceDto,
  SendMessageDto,
  WebhookPayloadDto,
  ConnectInstanceDto,
  DisconnectInstanceDto,
} from './dto/whatsapp.dto';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private evolutionApi: AxiosInstance;

  constructor(
    private readonly prisma: PrismaService,
    private readonly iaService: IAService,
  ) {
    // Inicializar cliente Axios para Evolution API
    this.evolutionApi = axios.create({
      baseURL: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Criar nova instância WhatsApp
   */
  async createInstance(dto: CreateInstanceDto) {
    const { tenantId, name, description } = dto;

    // Validar tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
    }

    // Gerar chave única da instância
    const instanceKey = `${tenant.slug}_${Date.now()}`;

    try {
      // Criar instância na Evolution API
      const response = await this.evolutionApi.post('/instance/create', {
        instanceName: instanceKey,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      });

      // Salvar instância no banco de dados
      const instance = await this.prisma.whatsAppInstance.create({
        data: {
          tenantId,
          name,
          instanceKey,
          status: 'pending_qr',
        },
      });

      this.logger.log(
        `WhatsApp instance created: ${instanceKey} for tenant ${tenantId}`,
      );

      return {
        instance,
        qrcode: response.data.qrcode,
        instanceKey,
      };
    } catch (error) {
      this.logger.error(
        `Error creating WhatsApp instance: ${error.message}`,
      );
      throw new HttpException(
        'Failed to create WhatsApp instance',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Conectar instância (após scanning QR code)
   */
  async connectInstance(dto: ConnectInstanceDto) {
    const { tenantId, instanceKey } = dto;

    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { tenantId, instanceKey },
    });

    if (!instance) {
      throw new HttpException(
        'WhatsApp instance not found',
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      // Verificar status na Evolution API
      const response = await this.evolutionApi.get(`/instance/fetch/${instanceKey}`);

      if (response.data.instance?.state === 'open') {
        await this.prisma.whatsAppInstance.update({
          where: { id: instance.id },
          data: { status: 'connected' },
        });

        this.logger.log(`WhatsApp instance connected: ${instanceKey}`);
        return { status: 'connected', instance };
      } else {
        return { status: 'waiting_qr', message: 'Please scan QR code' };
      }
    } catch (error) {
      this.logger.error(`Error connecting instance: ${error.message}`);
      throw new HttpException(
        'Failed to connect instance',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Desconectar instância
   */
  async disconnectInstance(dto: DisconnectInstanceDto) {
    const { tenantId, instanceKey } = dto;

    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { tenantId, instanceKey },
    });

    if (!instance) {
      throw new HttpException(
        'WhatsApp instance not found',
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      // Logout na Evolution API
      await this.evolutionApi.post(`/instance/logout/${instanceKey}`);

      await this.prisma.whatsAppInstance.update({
        where: { id: instance.id },
        data: { status: 'disconnected' },
      });

      this.logger.log(`WhatsApp instance disconnected: ${instanceKey}`);
      return { status: 'disconnected' };
    } catch (error) {
      this.logger.error(`Error disconnecting instance: ${error.message}`);
      throw new HttpException(
        'Failed to disconnect instance',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Enviar mensagem via WhatsApp
   */
  async sendMessage(dto: SendMessageDto) {
    const { tenantId, instanceKey, phoneNumber, message, mediaUrl } = dto;

    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { tenantId, instanceKey },
    });

    if (!instance) {
      throw new HttpException(
        'WhatsApp instance not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (instance.status !== 'connected') {
      throw new HttpException(
        'WhatsApp instance not connected',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Enviar mensagem via Evolution API
      const response = await this.evolutionApi.post(
        `/message/sendText/${instanceKey}`,
        {
          number: phoneNumber,
          text: message,
        },
      );

      // Registrar mensagem no banco de dados
      const contact = await this.prisma.contact.upsert({
        where: { id: `${tenantId}_${phoneNumber}` },
        update: {},
        create: {
          id: `${tenantId}_${phoneNumber}`,
          tenantId,
          name: phoneNumber,
          phone: phoneNumber,
        },
      });

      const chat = await this.prisma.chat.upsert({
        where: { id: `${instanceKey}_${phoneNumber}` },
        update: {},
        create: {
          id: `${instanceKey}_${phoneNumber}`,
          whatsappId: instance.id,
          contactId: contact.id,
        },
      });

      await this.prisma.message.create({
        data: {
          chatId: chat.id,
          sender: 'bot',
          content: message,
          type: 'BOT',
        },
      });

      this.logger.log(
        `Message sent to ${phoneNumber} via ${instanceKey}`,
      );

      return {
        success: true,
        messageId: response.data.messageId,
      };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      throw new HttpException(
        'Failed to send message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Processar webhook recebido da Evolution API
   */
  async processWebhook(payload: WebhookPayloadDto) {
    const { event, instanceKey, from, to, message, data, status } = payload;

    this.logger.log(
      `Processing webhook event: ${event} from ${instanceKey}`,
    );

    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { instanceKey },
    });

    if (!instance) {
      this.logger.warn(`Instance not found for key: ${instanceKey}`);
      return;
    }

    try {
      switch (event) {
        case 'message':
          if (from && message) {
            await this.handleIncomingMessage(instance, from, message, data);
          }
          break;

        case 'status':
          if (to && status) {
            await this.handleMessageStatus(instance, to, status);
          }
          break;

        case 'instance.connected':
          await this.prisma.whatsAppInstance.update({
            where: { id: instance.id },
            data: { status: 'connected' },
          });
          this.logger.log(`Instance connected: ${instanceKey}`);
          break;

        case 'instance.disconnected':
          await this.prisma.whatsAppInstance.update({
            where: { id: instance.id },
            data: { status: 'disconnected' },
          });
          this.logger.log(`Instance disconnected: ${instanceKey}`);
          break;
      }
    } catch (error) {
      this.logger.error(
        `Error processing webhook: ${error.message}`,
      );
    }
  }

  /**
   * Processar mensagem recebida
   */
  private async handleIncomingMessage(
    instance: any,
    from: string,
    message: string,
    data: any,
  ) {
    // Buscar ou criar contato
    const contact = await this.prisma.contact.upsert({
      where: { id: `${instance.tenantId}_${from}` },
      update: {},
      create: {
        id: `${instance.tenantId}_${from}`,
        tenantId: instance.tenantId,
        name: from,
        phone: from,
      },
    });

    // Buscar ou criar chat
    const chat = await this.prisma.chat.upsert({
      where: { id: `${instance.instanceKey}_${from}` },
      update: {},
      create: {
        id: `${instance.instanceKey}_${from}`,
        whatsappId: instance.id,
        contactId: contact.id,
      },
    });

    // Salvar mensagem do usuário
    await this.prisma.message.create({
      data: {
        chatId: chat.id,
        sender: from,
        content: message,
        type: 'USER',
      },
    });

    // Obter histórico de conversa
    const conversationHistory =
      await this.iaService.getConversationHistory(chat.id, 5);

    // Processar com IA
    try {
      const result = await this.iaService.processMessage({
        tenantId: instance.tenantId,
        chatId: chat.id,
        userMessage: message,
      });

      // Enviar resposta via WhatsApp
      await this.sendMessage({
        tenantId: instance.tenantId,
        instanceKey: instance.instanceKey,
        phoneNumber: from,
        message: result.response,
      });

      this.logger.log(
        `AI response sent to ${from} via ${instance.instanceKey}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing message with AI: ${error.message}`,
      );

      // Enviar mensagem de erro genérica
      await this.sendMessage({
        tenantId: instance.tenantId,
        instanceKey: instance.instanceKey,
        phoneNumber: from,
        message: 'Desculpe, não consegui processar sua mensagem. Tente novamente.',
      });
    }
  }

  /**
   * Processar confirmação de status de mensagem
   */
  private async handleMessageStatus(
    instance: any,
    to: string,
    status: string,
  ) {
    this.logger.log(
      `Message status updated: ${to} - ${status}`,
    );
    // Pode ser estendido para atualizar status no banco
  }

  /**
   * Listar instâncias do tenant
   */
  async listInstances(tenantId: string) {
    return this.prisma.whatsAppInstance.findMany({
      where: { tenantId },
    });
  }

  /**
   * Obter instância específica
   */
  async getInstance(tenantId: string, instanceKey: string) {
    return this.prisma.whatsAppInstance.findFirst({
      where: { tenantId, instanceKey },
    });
  }
}
