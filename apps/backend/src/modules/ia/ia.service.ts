import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { WordPressService } from '../wordpress/wordpress.service';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProcessMessageDto, AIProvider, SearchProductsDto } from './dto/ia.dto';
import axios from 'axios';

@Injectable()
export class IAService {
  private readonly logger = new Logger(IAService.name);
  private openai: OpenAI;
  private gemini: GoogleGenerativeAI;
  private ollamaUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly wordPressService: WordPressService,
  ) {
    // Inicializar OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Inicializar Google Gemini
    if (process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }

    // Inicializar Ollama (IA Open Source)
    this.ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    this.logger.log(`✓ Ollama available at ${this.ollamaUrl}`);
  }

  /**
   * Busca produtos no banco de dados baseado em query
   */
  async searchProducts(dto: SearchProductsDto) {
    const { tenantId, query, category, limit = '5' } = dto;

    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        ...(category && { category }),
      },
      take: parseInt(limit),
    });

    // Filtro simples por relevância (pode ser melhorado com full-text search)
    return products.filter(
      (p: any) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase()),
    );
  }

  /**
   * Processa mensagem do usuário com IA
   */
  async processMessage(dto: ProcessMessageDto) {
    const {
      tenantId,
      chatId,
      userMessage,
      provider = AIProvider.OPENAI,
      systemPrompt,
      conversationHistory = [],
    } = dto;

    // Validar se tenant existe
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { apiKeys: true },
    });

    if (!tenant) {
      throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
    }

    // Verificar se tem API key configurada (não necessária para Ollama)
    if (provider !== AIProvider.OLLAMA) {
      const apiKey = tenant.apiKeys.find((k: any) => k.type === provider.toUpperCase());

      if (!apiKey) {
        throw new HttpException(
          `API key for ${provider} not configured`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Buscar produtos relevantes (banco local + WordPress)
    const products = await this.searchProducts({
      tenantId,
      query: userMessage,
      limit: '3',
    });

    // Buscar contexto do WordPress se configurado
    let wpContext = '';
    try {
      const wpProducts = await this.wordPressService.getProductsForAIContext(
        tenantId,
        userMessage,
        3,
      );
      if (wpProducts.length > 0) {
        wpContext = `\n\nProdutos do WordPress encontrados:\n${wpProducts
          .map((p: any) => `- ${p.name} (R$ ${p.price}): ${p.description}`)
          .join('\n')}`;
      }
    } catch (error) {
      this.logger.debug(`WordPress context not available: ${error.message}`);
    }

    // Preparar contexto com produtos
    const productContext =
      products.length > 0
        ? `\n\nProdutos do banco local:\n${products.map((p: any) => `- ${p.name} (${p.category}): ${p.url || 'sem link'}`).join('\n')}`
        : '';

    const systemMessage = `${systemPrompt || 'Você é um assistente de vendas prestativo e profissional.'} ${productContext}${wpContext}`;

    let response: string;

    if (provider === AIProvider.OPENAI) {
      response = await this.callOpenAI(
        userMessage,
        systemMessage,
        conversationHistory,
      );
    } else if (provider === AIProvider.GEMINI) {
      response = await this.callGemini(
        userMessage,
        systemMessage,
        conversationHistory,
      );
    } else if (provider === AIProvider.OLLAMA) {
      response = await this.callOllama(
        userMessage,
        systemMessage,
        conversationHistory,
      );
    } else {
      throw new HttpException(
        'Invalid provider',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Salvar histórico de IA
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (chat) {
      await this.prisma.iAHistory.create({
        data: {
          tenantId,
          chatId,
          prompt: userMessage,
          response,
          source: provider === AIProvider.OPENAI ? 'OPENAI' : 'GEMINI',
        },
      });

      // Salvar mensagem do bot no histórico de chat
      await this.prisma.message.create({
        data: {
          chatId,
          sender: 'bot',
          content: response,
          type: 'BOT',
        },
      });
    }

    return {
      response,
      products,
      provider,
    };
  }

  /**
   * Chamar OpenAI API
   */
  private async callOpenAI(
    userMessage: string,
    systemMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
  ): Promise<string> {
    if (!this.openai) {
      throw new HttpException(
        'OpenAI not configured',
        HttpStatus.BAD_REQUEST,
      );
    }

    const messages = [
      ...conversationHistory,
      {
        role: 'user' as const,
        content: userMessage,
      },
    ];

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ] as any,
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || 'Sem resposta';
  }

  /**
   * Chamar Google Gemini API
   */
  private async callGemini(
    userMessage: string,
    systemMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
  ): Promise<string> {
    if (!this.gemini) {
      throw new HttpException(
        'Gemini not configured',
        HttpStatus.BAD_REQUEST,
      );
    }

    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });

    const chat = model.startChat({
      history: conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'model',
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage(userMessage);
    const text = result.response.text();

    return text || 'Sem resposta';
  }

  /**
   * Chamar Ollama (IA Open Source)
   */
  private async callOllama(
    userMessage: string,
    systemMessage: string,
    conversationHistory: { role: string; content: string }[],
  ) {
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/chat`, {
        model: 'neural-chat', // Pode ser alterado: mistral, llama2, etc
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          ...conversationHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          {
            role: 'user',
            content: userMessage,
          },
        ],
        stream: false,
        options: {
          temperature: 0.7,
          top_k: 40,
          top_p: 0.9,
        },
      });

      return response.data.message?.content || 'Sem resposta';
    } catch (error) {
      this.logger.error(`Ollama error: ${error.message}`);
      throw new HttpException(
        `Failed to get response from Ollama: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obter histórico de conversa
   */
  async getConversationHistory(chatId: string, limit: number = 10) {
    const messages = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.reverse().map((m: any) => ({
      role: m.type === 'BOT' ? 'assistant' : 'user',
      content: m.content,
    }));
  }

  /**
   * Obter configuração customizada de IA do tenant
   */
  async getTenantIAConfig(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { apiKeys: true },
    });

    if (!tenant) {
      throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
    }

    return {
      tenantId,
      hasOpenAI: tenant.apiKeys.some((k: any) => k.type === 'OPENAI'),
      hasGemini: tenant.apiKeys.some((k: any) => k.type === 'GEMINI'),
    };
  }
}
