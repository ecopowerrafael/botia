import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WordPressService } from './wordpress.service';
import {
  ConnectWordPressDto,
  ConfigureFieldsDto,
  SyncDataDto,
} from './dto/wordpress.dto';

@Controller('wordpress')
export class WordPressController {
  constructor(private readonly wordPressService: WordPressService) {}

  /**
   * Conectar com um site WordPress
   * POST /wordpress/connect
   */
  @Post('connect')
  async connectWordPress(
    @Body() dto: ConnectWordPressDto & { tenantId: string },
  ) {
    if (!dto.tenantId) {
      throw new HttpException('tenantId is required', HttpStatus.BAD_REQUEST);
    }

    return this.wordPressService.connectWordPress(dto.tenantId, dto);
  }

  /**
   * Configurar quais campos sincronizar
   * PUT /wordpress/:integrationId/configure
   */
  @Post(':integrationId/configure')
  async configureFields(
    @Param('integrationId') integrationId: string,
    @Body() dto: ConfigureFieldsDto & { tenantId: string },
  ) {
    if (!dto.tenantId) {
      throw new HttpException('tenantId is required', HttpStatus.BAD_REQUEST);
    }

    return this.wordPressService.configureFields(dto.tenantId, {
      ...dto,
      integrationId,
    });
  }

  /**
   * Sincronizar dados do WordPress
   * POST /wordpress/:integrationId/sync
   */
  @Post(':integrationId/sync')
  async syncData(
    @Param('integrationId') integrationId: string,
    @Body() dto: SyncDataDto & { tenantId: string },
  ) {
    if (!dto.tenantId) {
      throw new HttpException('tenantId is required', HttpStatus.BAD_REQUEST);
    }

    return this.wordPressService.syncData(dto.tenantId, {
      ...dto,
      integrationId,
    });
  }

  /**
   * Listar integrações do tenant
   * GET /wordpress/integrations?tenantId=xxx
   */
  @Get('integrations')
  async listIntegrations(@Query('tenantId') tenantId: string) {
    if (!tenantId) {
      throw new HttpException('tenantId is required', HttpStatus.BAD_REQUEST);
    }

    return this.wordPressService.listIntegrations(tenantId);
  }

  /**
   * Obter detalhes de uma integração
   * GET /wordpress/:integrationId?tenantId=xxx
   */
  @Get(':integrationId')
  async getIntegration(
    @Param('integrationId') integrationId: string,
    @Query('tenantId') tenantId: string,
  ) {
    if (!tenantId) {
      throw new HttpException('tenantId is required', HttpStatus.BAD_REQUEST);
    }

    return this.wordPressService.getIntegration(integrationId, tenantId);
  }

  /**
   * Desativar integração
   * DELETE /wordpress/:integrationId?tenantId=xxx
   */
  @Delete(':integrationId')
  async disableIntegration(
    @Param('integrationId') integrationId: string,
    @Query('tenantId') tenantId: string,
  ) {
    if (!tenantId) {
      throw new HttpException('tenantId is required', HttpStatus.BAD_REQUEST);
    }

    return this.wordPressService.disableIntegration(integrationId, tenantId);
  }
}
