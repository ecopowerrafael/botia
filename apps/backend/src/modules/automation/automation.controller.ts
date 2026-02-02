import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AutomationService } from './automation.service';
import {
  CreateDripCampaignDto,
  CreateMassCampaignDto,
  UpdateCampaignStatusDto,
} from './dto/automation.dto';

@Controller('automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  /**
   * Criar campanha Drip
   * POST /automation/drip
   */
  @Post('drip')
  async createDripCampaign(@Body() dto: CreateDripCampaignDto) {
    return this.automationService.createDripCampaign(dto);
  }

  /**
   * Criar campanha em Massa
   * POST /automation/mass
   */
  @Post('mass')
  async createMassCampaign(@Body() dto: CreateMassCampaignDto) {
    return this.automationService.createMassCampaign(dto);
  }

  /**
   * Listar campanhas
   * GET /automation/campaigns?tenantId=xxx&type=DRIP&status=ACTIVE
   */
  @Get('campaigns')
  async listCampaigns(
    @Query('tenantId') tenantId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    if (!tenantId) {
      throw new HttpException('tenantId is required', HttpStatus.BAD_REQUEST);
    }

    return this.automationService.listCampaigns(tenantId, type, status);
  }

  /**
   * Obter campanha específica
   * GET /automation/campaigns/:campaignId
   */
  @Get('campaigns/:campaignId')
  async getCampaign(
    @Param('campaignId') campaignId: string,
    @Query('tenantId') tenantId: string,
  ) {
    if (!tenantId) {
      throw new HttpException('tenantId is required', HttpStatus.BAD_REQUEST);
    }

    return this.automationService.getCampaign(campaignId, tenantId);
  }

  /**
   * Obter estatísticas da campanha
   * GET /automation/campaigns/:campaignId/stats
   */
  @Get('campaigns/:campaignId/stats')
  async getCampaignStats(
    @Param('campaignId') campaignId: string,
    @Query('tenantId') tenantId: string,
  ) {
    if (!tenantId) {
      throw new HttpException('tenantId is required', HttpStatus.BAD_REQUEST);
    }

    return this.automationService.getCampaignStats(campaignId, tenantId);
  }

  /**
   * Pausar campanha
   * PUT /automation/campaigns/:campaignId/pause
   */
  @Put('campaigns/:campaignId/pause')
  async pauseCampaign(@Param('campaignId') campaignId: string) {
    return this.automationService.pauseCampaign(campaignId);
  }

  /**
   * Retomar campanha
   * PUT /automation/campaigns/:campaignId/resume
   */
  @Put('campaigns/:campaignId/resume')
  async resumeCampaign(@Param('campaignId') campaignId: string) {
    return this.automationService.resumeCampaign(campaignId);
  }

  /**
   * Deletar campanha
   * DELETE /automation/campaigns/:campaignId
   */
  @Delete('campaigns/:campaignId')
  async deleteCampaign(@Param('campaignId') campaignId: string) {
    return this.automationService.deleteCampaign(campaignId);
  }
}
