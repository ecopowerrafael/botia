import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import {
  ConnectWordPressDto,
  ConfigureFieldsDto,
  SyncDataDto,
  WordPressProductDto,
} from './dto/wordpress.dto';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class WordPressService {
  private readonly logger = new Logger(WordPressService.name);
  private wpClients: Map<string, AxiosInstance> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Conectar com um site WordPress
   */
  async connectWordPress(tenantId: string, dto: ConnectWordPressDto) {
    // Validar tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
    }

    // Testar conexão com a API do WordPress
    try {
      const apiUrl = this.getApiUrl(dto.siteUrl);
      const client = this.createClient(apiUrl, dto.username, dto.appPassword);

      // Testar conexão
      await client.get('/');
      this.logger.log(`✓ Connected to WordPress: ${dto.siteUrl}`);
    } catch (error) {
      this.logger.error(`✗ Failed to connect to WordPress: ${error.message}`);
      throw new HttpException(
        `Failed to connect to WordPress: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Salvar configuração
    const productFields = dto.productFields || [
      'id',
      'name',
      'price',
      'description',
      'images',
      'categories',
    ];

    const integration = await this.prisma.wordPressIntegration.upsert({
      where: {
        tenantId_siteUrl: {
          tenantId,
          siteUrl: dto.siteUrl,
        },
      },
      update: {
        apiUrl: this.getApiUrl(dto.siteUrl),
        username: dto.username,
        appPassword: dto.appPassword,
        syncProducts: dto.syncProducts ?? true,
        syncPosts: dto.syncPosts ?? false,
        syncPages: dto.syncPages ?? false,
        productFields: JSON.stringify(productFields),
      },
      create: {
        tenantId,
        siteUrl: dto.siteUrl,
        apiUrl: this.getApiUrl(dto.siteUrl),
        username: dto.username,
        appPassword: dto.appPassword,
        syncProducts: dto.syncProducts ?? true,
        syncPosts: dto.syncPosts ?? false,
        syncPages: dto.syncPages ?? false,
        productFields: JSON.stringify(productFields),
      },
    });

    return {
      success: true,
      integration: {
        id: integration.id,
        siteUrl: integration.siteUrl,
        isActive: integration.isActive,
        syncProducts: integration.syncProducts,
        lastSyncedAt: integration.lastSyncedAt,
      },
    };
  }

  /**
   * Configurar quais campos sincronizar
   */
  async configureFields(tenantId: string, dto: ConfigureFieldsDto) {
    const integration = await this.prisma.wordPressIntegration.findFirst({
      where: { id: dto.integrationId, tenantId },
    });

    if (!integration) {
      throw new HttpException(
        'WordPress integration not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Validar campos disponíveis
    const validFields = [
      'id',
      'name',
      'slug',
      'description',
      'price',
      'regular_price',
      'sale_price',
      'images',
      'categories',
      'tags',
      'attributes',
      'stock',
      'status',
    ];

    const invalidFields = dto.productFields.filter(
      (f) => !validFields.includes(f),
    );
    if (invalidFields.length > 0) {
      throw new HttpException(
        `Invalid fields: ${invalidFields.join(', ')}. Valid fields: ${validFields.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const updated = await this.prisma.wordPressIntegration.update({
      where: { id: dto.integrationId },
      data: {
        productFields: JSON.stringify(dto.productFields),
        syncProducts: dto.syncProducts,
        syncPosts: dto.syncPosts,
        syncPages: dto.syncPages,
        syncFrequency: dto.syncFrequency,
      },
    });

    return {
      success: true,
      fields: JSON.parse(updated.productFields),
      sync: {
        products: updated.syncProducts,
        posts: updated.syncPosts,
        pages: updated.syncPages,
      },
    };
  }

  /**
   * Sincronizar dados do WordPress
   */
  async syncData(tenantId: string, dto: SyncDataDto) {
    const integration = await this.prisma.wordPressIntegration.findFirst({
      where: { id: dto.integrationId, tenantId },
    });

    if (!integration) {
      throw new HttpException(
        'WordPress integration not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (!integration.isActive) {
      throw new HttpException(
        'WordPress integration is inactive',
        HttpStatus.BAD_REQUEST,
      );
    }

    const stats = {
      products: 0,
      posts: 0,
      pages: 0,
      errors: 0,
    };

    try {
      const client = this.createClient(
        integration.apiUrl,
        integration.username || undefined,
        integration.appPassword || undefined,
      );

      // Sincronizar produtos
      if (integration.syncProducts) {
        const productFields = JSON.parse(integration.productFields);
        const limit = dto.limit || 100;

        try {
          const response = await client.get('/products', {
            params: {
              per_page: Math.min(limit, 100),
              orderby: 'date',
              order: 'desc',
            },
          });

          for (const wpProduct of response.data) {
            try {
              await this.saveWordPressProduct(
                tenantId,
                wpProduct,
                productFields,
              );
              stats.products++;
            } catch (error) {
              this.logger.error(
                `Error saving product ${wpProduct.id}: ${error.message}`,
              );
              stats.errors++;
            }
          }
        } catch (error) {
          this.logger.error(`Error fetching products: ${error.message}`);
          stats.errors++;
        }
      }

      // Atualizar lastSyncedAt
      await this.prisma.wordPressIntegration.update({
        where: { id: dto.integrationId },
        data: { lastSyncedAt: new Date() },
      });

      return {
        success: true,
        stats,
        message: `Synced ${stats.products} products, ${stats.posts} posts, ${stats.pages} pages`,
      };
    } catch (error) {
      this.logger.error(`Sync error: ${error.message}`);
      throw new HttpException(
        `Sync failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Salvar produto do WordPress no banco
   */
  private async saveWordPressProduct(
    tenantId: string,
    wpProduct: WordPressProductDto,
    selectedFields: string[],
  ) {
    // Extrair apenas os campos selecionados
    const product: any = {};

    if (selectedFields.includes('id'))
      product.id = wpProduct.id;
    if (selectedFields.includes('name'))
      product.name = wpProduct.name;
    if (selectedFields.includes('slug'))
      product.slug = wpProduct.slug;
    if (selectedFields.includes('description'))
      product.description = wpProduct.description || '';
    if (selectedFields.includes('price'))
      product.price = parseFloat(String(wpProduct.price || 0));
    if (selectedFields.includes('images'))
      product.images =
        wpProduct.images?.map((img) => img.src).join(',') || '';
    if (selectedFields.includes('categories'))
      product.categories =
        wpProduct.categories?.map((cat) => cat.name).join(',') || '';

    // Salvar no banco
    await this.prisma.wordPressProduct.upsert({
      where: {
        tenantId_wpProductId: {
          tenantId,
          wpProductId: wpProduct.id,
        },
      },
      update: {
        ...product,
        syncedAt: new Date(),
      },
      create: {
        tenantId,
        wpProductId: wpProduct.id,
        name: wpProduct.name,
        slug: wpProduct.slug,
        description: wpProduct.description,
        price: parseFloat(String(wpProduct.price || 0)),
        regularPrice: wpProduct.regular_price
          ? parseFloat(String(wpProduct.regular_price))
          : undefined,
        salePrice: wpProduct.sale_price
          ? parseFloat(String(wpProduct.sale_price))
          : undefined,
        image: wpProduct.images?.[0]?.src,
        images: wpProduct.images ? JSON.stringify(wpProduct.images) : undefined,
        categories: wpProduct.categories
          ? JSON.stringify(wpProduct.categories)
          : undefined,
        tags: wpProduct.tags ? JSON.stringify(wpProduct.tags) : undefined,
        attributes: wpProduct.attributes,
        stock: wpProduct.stock,
        status: wpProduct.status,
      },
    });
  }

  /**
   * Obter produtos sincronizados para contexto da IA
   */
  async getProductsForAIContext(
    tenantId: string,
    query: string,
    limit: number = 5,
  ) {
    const products = await this.prisma.wordPressProduct.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { categories: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { syncedAt: 'desc' },
    });

    return products.map((p: any) => ({
      name: p.name,
      price: p.price,
      description: p.description,
      categories: p.categories ? JSON.parse(p.categories) : [],
    }));
  }

  /**
   * Listar integrações do tenant
   */
  async listIntegrations(tenantId: string) {
    return this.prisma.wordPressIntegration.findMany({
      where: { tenantId },
      select: {
        id: true,
        siteUrl: true,
        isActive: true,
        syncProducts: true,
        syncPosts: true,
        syncPages: true,
        lastSyncedAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Obter detalhes de uma integração
   */
  async getIntegration(integrationId: string, tenantId: string) {
    const integration = await this.prisma.wordPressIntegration.findFirst({
      where: { id: integrationId, tenantId },
      select: {
        id: true,
        siteUrl: true,
        isActive: true,
        syncProducts: true,
        syncPosts: true,
        syncPages: true,
        productFields: true,
        lastSyncedAt: true,
        syncFrequency: true,
        createdAt: true,
      },
    });

    if (!integration) {
      throw new HttpException(
        'Integration not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      ...integration,
      productFields: JSON.parse(integration.productFields),
    };
  }

  /**
   * Desativar integração
   */
  async disableIntegration(integrationId: string, tenantId: string) {
    const integration = await this.prisma.wordPressIntegration.findFirst({
      where: { id: integrationId, tenantId },
    });

    if (!integration) {
      throw new HttpException(
        'Integration not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.wordPressIntegration.update({
      where: { id: integrationId },
      data: { isActive: false },
    });

    return { success: true, message: 'Integration disabled' };
  }

  // ============ Métodos auxiliares ============

  private getApiUrl(siteUrl: string): string {
    const cleanUrl = siteUrl.replace(/\/$/, '');
    return `${cleanUrl}/wp-json/wp/v2`;
  }

  private createClient(
    apiUrl: string,
    username?: string,
    password?: string,
  ): AxiosInstance {
    const headers: any = {
      'Content-Type': 'application/json',
      'User-Agent': 'WhatsApp-Bot/1.0',
    };

    if (username && password) {
      const auth = Buffer.from(`${username}:${password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    return axios.create({
      baseURL: apiUrl,
      headers,
      timeout: 10000,
    });
  }
}
