import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import { ScrapeUrlDto, UploadCsvDto, CsvProductDto } from './dto/knowledge.dto';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);
  private browser: puppeteer.Browser;

  constructor(private readonly prisma: PrismaService) {
    this.initBrowser();
  }

  /**
   * Inicializar browser Puppeteer
   */
  private async initBrowser() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      this.logger.log('Puppeteer browser initialized');
    } catch (error) {
      this.logger.warn('Failed to initialize Puppeteer, web scraping disabled');
    }
  }

  /**
   * Fazer web scraping de URL
   */
  async scrapeUrl(dto: ScrapeUrlDto) {
    const {
      tenantId,
      url,
      selector = '.product',
      nameSelector = '.name',
      descriptionSelector = '.description',
      priceSelector = '.price',
      urlSelector = 'a',
      category,
    } = dto;

    // Validar tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
    }

    try {
      // Fazer requisição HTTP e parse do HTML
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);

      const products: CsvProductDto[] = [];

      // Extrair produtos baseado no seletor
      $(selector).each((index, element) => {
        const $element = $(element);

        const product: CsvProductDto = {
          name:
            $element.find(nameSelector).text().trim() ||
            `Product ${index + 1}`,
          category: category || 'Geral',
          price: this.parsePrice(
            $element.find(priceSelector).text().trim(),
          ) || undefined,
          url: $element.find(urlSelector).attr('href') || url,
          metadata: {
            description: $element.find(descriptionSelector).text().trim(),
            scraped_at: new Date().toISOString(),
            scraped_from: url,
          },
        };

        products.push(product);
      });

      if (products.length === 0) {
        throw new HttpException(
          'No products found with the provided selectors',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Salvar produtos no banco
      const savedProducts = await Promise.all(
        products.map((product) =>
          this.prisma.product.create({
            data: {
              tenantId,
              name: product.name,
              category: product.category || 'Geral',
              price: product.price,
              url: product.url,
              metadata: product.metadata,
            },
          }),
        ),
      );

      this.logger.log(
        `Scraped ${savedProducts.length} products from ${url}`,
      );

      return {
        success: true,
        count: savedProducts.length,
        products: savedProducts,
      };
    } catch (error) {
      this.logger.error(`Error scraping URL ${url}: ${error.message}`);
      throw new HttpException(
        `Failed to scrape URL: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Fazer web scraping com Puppeteer (JavaScript rendering)
   */
  async scrapeDynamicUrl(dto: ScrapeUrlDto) {
    if (!this.browser) {
      throw new HttpException(
        'Puppeteer not available',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const {
      tenantId,
      url,
      selector = '.product',
      nameSelector = '.name',
      priceSelector = '.price',
      category,
    } = dto;

    // Validar tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
    }

    let page: puppeteer.Page | undefined;

    try {
      page = await this.browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });

      // Extrair dados usando JavaScript
      const products = await page.evaluate(
        (sel, nameSel, priceSel) => {
          const elements = document.querySelectorAll(sel);
          const data: any[] = [];

          elements.forEach((el) => {
            const name = el.querySelector(nameSel)?.textContent?.trim() || '';
            const price = el.querySelector(priceSel)?.textContent?.trim() || '';

            if (name) {
              data.push({ name, price });
            }
          });

          return data;
        },
        selector,
        nameSelector,
        priceSelector,
      );

      // Salvar produtos
      const savedProducts = await Promise.all(
        products.map((product) =>
          this.prisma.product.create({
            data: {
              tenantId,
              name: product.name,
              category: category || 'Geral',
              price: this.parsePrice(product.price),
              url,
              metadata: {
                scraped_at: new Date().toISOString(),
                scraped_from: url,
              },
            },
          }),
        ),
      );

      this.logger.log(
        `Scraped ${savedProducts.length} products from ${url} (dynamic)`,
      );

      return {
        success: true,
        count: savedProducts.length,
        products: savedProducts,
      };
    } catch (error) {
      this.logger.error(
        `Error scraping dynamic URL ${url}: ${error.message}`,
      );
      throw new HttpException(
        `Failed to scrape dynamic URL: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      if (page as any) {
        await (page as any).close();
      }
    }
  }

  /**
   * Upload e parsing de arquivo CSV
   */
  async uploadCsv(tenantId: string, filePath: string, dto: UploadCsvDto) {
    const { category, updateMode = 'append' } = dto;

    // Validar tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
    }

    try {
      // Ler e fazer parse do CSV
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });

      // Se update mode é replace, deletar produtos antigos da categoria
      if (updateMode === 'replace' && category) {
        await this.prisma.product.deleteMany({
          where: { tenantId, category },
        });
      }

      // Salvar produtos do CSV
      const savedProducts = await Promise.all(
        (records as any[]).map((record) =>
          this.prisma.product.create({
            data: {
              tenantId,
              name: record.name || record.product_name || 'Produto sem nome',
              category: category || record.category || 'Geral',
              price: this.parsePrice(record.price),
              url: record.url || record.product_url,
              stock: record.stock ? parseInt(record.stock) : null,
              metadata: {
                ...record,
                uploaded_at: new Date().toISOString(),
              },
            },
          }),
        ),
      );

      // Deletar arquivo após processar
      fs.unlinkSync(filePath);

      this.logger.log(
        `Uploaded ${savedProducts.length} products from CSV for tenant ${tenantId}`,
      );

      return {
        success: true,
        count: savedProducts.length,
        products: savedProducts,
      };
    } catch (error) {
      // Deletar arquivo em caso de erro
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      this.logger.error(`Error uploading CSV: ${error.message}`);
      throw new HttpException(
        `Failed to upload CSV: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Listar produtos do tenant
   */
  async listProducts(
    tenantId: string,
    category?: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        ...(category && { category }),
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Contar produtos do tenant
   */
  async countProducts(tenantId: string, category?: string) {
    return this.prisma.product.count({
      where: {
        tenantId,
        ...(category && { category }),
      },
    });
  }

  /**
   * Buscar produtos por nome
   */
  async searchProducts(
    tenantId: string,
    query: string,
    limit: number = 10,
  ) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
    });
  }

  /**
   * Deletar produto
   */
  async deleteProduct(tenantId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.product.delete({ where: { id: productId } });

    return { success: true, message: 'Product deleted' };
  }

  /**
   * Deletar todos os produtos de uma categoria
   */
  async deleteProductsByCategory(tenantId: string, category: string) {
    const result = await this.prisma.product.deleteMany({
      where: { tenantId, category },
    });

    return {
      success: true,
      deletedCount: result.count,
    };
  }

  /**
   * Parser de preço (ex: "R$ 150,00" -> 150.00)
   */
  private parsePrice(priceStr: string): number | undefined {
    if (!priceStr) return undefined;

    // Remover símbolos de moeda e espaços
    const cleaned = priceStr
      .replace(/[^\d,.-]/g, '')
      .replace(/\./g, '')
      .replace(/,/, '.');

    const price = parseFloat(cleaned);
    return isNaN(price) ? undefined : price;
  }
}
