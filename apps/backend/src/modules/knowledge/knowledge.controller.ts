import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Request } from 'express';
import * as path from 'path';
import { KnowledgeService } from './knowledge.service';
import { ScrapeUrlDto, UploadCsvDto } from './dto/knowledge.dto';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  /**
   * POST /knowledge/scrape
   * Fazer web scraping de URL (HTML estático)
   */
  @Post('scrape')
  @HttpCode(200)
  async scrapeUrl(@Body() dto: ScrapeUrlDto) {
    return this.knowledgeService.scrapeUrl(dto);
  }

  /**
   * POST /knowledge/scrape-dynamic
   * Fazer web scraping com JavaScript rendering
   */
  @Post('scrape-dynamic')
  @HttpCode(200)
  async scrapeDynamicUrl(@Body() dto: ScrapeUrlDto) {
    return this.knowledgeService.scrapeDynamicUrl(dto);
  }

  /**
   * POST /knowledge/upload-csv
   * Upload de arquivo CSV
   */
  @Post('upload-csv')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './tmp',
        filename: (req: Request, file: any, cb: any) => {
          cb(null, `${Date.now()}_${file.originalname}`);
        },
      }),
      fileFilter: (req: Request, file: any, cb: any) => {
        if (path.extname(file.originalname).toLowerCase() !== '.csv') {
          cb(new BadRequestException('Only CSV files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async uploadCsv(
    @UploadedFile() file: any,
    @Body() dto: UploadCsvDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.knowledgeService.uploadCsv(dto.tenantId, file.path, dto);
  }

  /**
   * GET /knowledge/products/:tenantId
   * Listar produtos do tenant com paginação
   */
  @Get('products/:tenantId')
  async listProducts(
    @Param('tenantId') tenantId: string,
    @Query('category') category?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 50;
    const offsetNum = offset ? parseInt(offset) : 0;

    const [products, total] = await Promise.all([
      this.knowledgeService.listProducts(
        tenantId,
        category,
        limitNum,
        offsetNum,
      ),
      this.knowledgeService.countProducts(tenantId, category),
    ]);

    return {
      products,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
    };
  }

  /**
   * GET /knowledge/search/:tenantId
   * Buscar produtos por query
   */
  @Get('search/:tenantId')
  async searchProducts(
    @Param('tenantId') tenantId: string,
    @Query('q') query?: string,
    @Query('limit') limit?: string,
  ) {
    if (!query) {
      throw new BadRequestException('Search query is required');
    }

    const limitNum = limit ? parseInt(limit) : 10;

    return this.knowledgeService.searchProducts(tenantId, query, limitNum);
  }

  /**
   * DELETE /knowledge/product/:tenantId/:productId
   * Deletar um produto
   */
  @Delete('product/:tenantId/:productId')
  async deleteProduct(
    @Param('tenantId') tenantId: string,
    @Param('productId') productId: string,
  ) {
    return this.knowledgeService.deleteProduct(tenantId, productId);
  }

  /**
   * DELETE /knowledge/category/:tenantId/:category
   * Deletar todos os produtos de uma categoria
   */
  @Delete('category/:tenantId/:category')
  async deleteProductsByCategory(
    @Param('tenantId') tenantId: string,
    @Param('category') category: string,
  ) {
    return this.knowledgeService.deleteProductsByCategory(tenantId, category);
  }

  /**
   * GET /knowledge/stats/:tenantId
   * Estatísticas de produtos do tenant
   */
  @Get('stats/:tenantId')
  async getStats(@Param('tenantId') tenantId: string) {
    const total = await this.knowledgeService.countProducts(tenantId);

    return {
      tenantId,
      total,
    };
  }
}
