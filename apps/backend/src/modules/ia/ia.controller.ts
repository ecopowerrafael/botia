import { Controller, Post, Get, Body, Param, HttpCode } from '@nestjs/common';
import { IAService } from './ia.service';
import { ProcessMessageDto, SearchProductsDto } from './dto/ia.dto';

@Controller('ia')
export class IAController {
  constructor(private readonly iaService: IAService) {}

  /**
   * POST /ia/process-message
   * Processa uma mensagem do usuário através da IA
   */
  @Post('process-message')
  @HttpCode(200)
  async processMessage(@Body() dto: ProcessMessageDto) {
    return this.iaService.processMessage(dto);
  }

  /**
   * POST /ia/search-products
   * Busca produtos no banco de dados
   */
  @Post('search-products')
  async searchProducts(@Body() dto: SearchProductsDto) {
    return this.iaService.searchProducts(dto);
  }

  /**
   * GET /ia/conversation/:chatId
   * Obtém histórico de conversa
   */
  @Get('conversation/:chatId')
  async getConversationHistory(@Param('chatId') chatId: string) {
    return this.iaService.getConversationHistory(chatId);
  }

  /**
   * GET /ia/config/:tenantId
   * Obtém configuração de IA do tenant
   */
  @Get('config/:tenantId')
  async getTenantIAConfig(@Param('tenantId') tenantId: string) {
    return this.iaService.getTenantIAConfig(tenantId);
  }
}
