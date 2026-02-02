import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import {
  CreateInstanceDto,
  SendMessageDto,
  WebhookPayloadDto,
  ConnectInstanceDto,
  DisconnectInstanceDto,
} from './dto/whatsapp.dto';

@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(private readonly whatsappService: WhatsAppService) {}

  /**
   * POST /whatsapp/instance/create
   * Criar nova instância WhatsApp
   */
  @Post('instance/create')
  async createInstance(@Body() dto: CreateInstanceDto) {
    return this.whatsappService.createInstance(dto);
  }

  /**
   * POST /whatsapp/instance/connect
   * Conectar instância após scanning QR code
   */
  @Post('instance/connect')
  async connectInstance(@Body() dto: ConnectInstanceDto) {
    return this.whatsappService.connectInstance(dto);
  }

  /**
   * POST /whatsapp/instance/disconnect
   * Desconectar instância
   */
  @Post('instance/disconnect')
  async disconnectInstance(@Body() dto: DisconnectInstanceDto) {
    return this.whatsappService.disconnectInstance(dto);
  }

  /**
   * GET /whatsapp/instance/:tenantId
   * Listar instâncias do tenant
   */
  @Get('instance/:tenantId')
  async listInstances(@Param('tenantId') tenantId: string) {
    return this.whatsappService.listInstances(tenantId);
  }

  /**
   * GET /whatsapp/instance/:tenantId/:instanceKey
   * Obter instância específica
   */
  @Get('instance/:tenantId/:instanceKey')
  async getInstance(
    @Param('tenantId') tenantId: string,
    @Param('instanceKey') instanceKey: string,
  ) {
    return this.whatsappService.getInstance(tenantId, instanceKey);
  }

  /**
   * POST /whatsapp/message/send
   * Enviar mensagem via WhatsApp
   */
  @Post('message/send')
  @HttpCode(200)
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.whatsappService.sendMessage(dto);
  }

  /**
   * POST /whatsapp/webhook
   * Receber webhooks da Evolution API
   */
  @Post('webhook')
  @HttpCode(200)
  async receiveWebhook(@Body() payload: WebhookPayloadDto) {
    this.logger.log(`Webhook received: ${payload.event}`);
    await this.whatsappService.processWebhook(payload);
    return { success: true };
  }
}
