import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../shared/prisma.service';
import {
  DetectIntentDto,
  ExtractEntitiesDto,
  ProcessTranscriptDto,
  DetectIntentResponseDto,
  ExtractEntitiesResponseDto,
  ProcessTranscriptResponseDto,
  EntityDto,
  KNOWN_INTENTS,
} from './intent.dto';

@Injectable()
export class IntentService {
  private ollamaApiUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';

  constructor(
    private httpService: HttpService,
    private prisma: PrismaService,
  ) {}

  /**
   * Detecta a intenção principal do texto usando Ollama
   * Exemplo: "Quero 2 vinhos" → COMPRA
   */
  async detectIntent(dto: DetectIntentDto): Promise<DetectIntentResponseDto> {
    const { text, language = 'pt', context = '' } = dto;

    // Prompt customizado em português para melhor detecção
    const prompt = `Você é um especialista em NLU (Natural Language Understanding).

Analise o texto do usuário e retorne um JSON com:
- intent: uma das intents conhecidas (COMPRA, PERGUNTA, RECLAMACAO, SAUDACAO, HORARIO, LOCALIZACAO, CARDAPIO, CANCELAR_PEDIDO, REEMBOLSO, RASTREAMENTO, PROMOÇÃO, FEEDBACK, SUPORTE, AGENTE_HUMANO)
- confidence: número entre 0 e 1
- sentiment: positivo, negativo ou neutro
- entities: lista de entidades extraídas
- suggestedAction: ação recomendada

Texto: "${text}"
${context ? `Contexto: ${context}` : ''}

Retorne APENAS um JSON válido, nenhum texto adicional.`;

    try {
      const response = await this.callOllama(prompt, 'mistral');
      const parsed = this.parseOllamaJson(response);

      // Validar confiança mínima
      if (parsed.confidence < 0.3) {
        parsed.intent = 'PERGUNTA'; // fallback para intent genérica
        parsed.confidence = 0.3;
      }

      return {
        intent: parsed.intent || 'PERGUNTA',
        confidence: parsed.confidence || 0.5,
        subIntents: parsed.subIntents || [],
        entities: parsed.entities || [],
        sentiment: parsed.sentiment || 'neutro',
        suggestedAction: parsed.suggestedAction || 'Responder com cardápio',
        rawText: text,
        language,
      };
    } catch (error) {
      console.error('Erro ao detectar intent:', error);
      // Fallback: tentar detecção simples por palavras-chave
      return this.detectIntentFallback(text);
    }
  }

  /**
   * Extrai entidades do texto (produto, quantidade, preço, etc)
   */
  async extractEntities(dto: ExtractEntitiesDto): Promise<ExtractEntitiesResponseDto> {
    const { text, intent, knownEntities = [], language = 'pt' } = dto;

    const prompt = `Você é um especialista em extração de entidades.

Analise o texto e extraia entidades relevantes.
Tipos: PRODUTO, QUANTIDADE, CATEGORIA, PRECO, TEMPO, LOCALIZACAO, CONTATO

Texto: "${text}"
Intent: ${intent}
${knownEntities.length > 0 ? `Produtos conhecidos: ${knownEntities.join(', ')}` : ''}

Retorne JSON:
{
  "entities": [
    {"type": "QUANTIDADE", "value": "2", "confidence": 0.95, "position": {"start": 0, "end": 1}},
    {"type": "PRODUTO", "value": "vinho tinto", "confidence": 0.90, "position": {"start": 7, "end": 17}}
  ]
}

Retorne APENAS o JSON.`;

    try {
      const response = await this.callOllama(prompt, 'mistral');
      const parsed = this.parseOllamaJson(response);

      return {
        text,
        entities: parsed.entities || [],
        totalEntities: (parsed.entities || []).length,
        language,
      };
    } catch (error) {
      console.error('Erro ao extrair entidades:', error);
      return {
        text,
        entities: [],
        totalEntities: 0,
        language,
      };
    }
  }

  /**
   * Processa uma transcrição completa:
   * 1. Detecta intenção
   * 2. Extrai entidades
   * 3. Sugere ação (adicionar ao carrinho, gerar resposta, etc)
   */
  async processTranscript(
    dto: ProcessTranscriptDto,
  ): Promise<ProcessTranscriptResponseDto> {
    const { audioMessageId, transcript, confidence, chatId, context } = dto;

    // Passo 1: Detectar intenção
    const intentResult = await this.detectIntent({
      text: transcript,
      language: 'pt',
      context,
      chatId,
    });

    // Passo 2: Extrair entidades
    const entitiesResult = await this.extractEntities({
      text: transcript,
      intent: intentResult.intent,
      language: 'pt',
    });

    // Passo 3: Gerar ação baseada na intenção
    const action = this.suggestAction(
      intentResult.intent,
      entitiesResult.entities,
      transcript,
    );

    const response: ProcessTranscriptResponseDto = {
      audioMessageId,
      transcript,
      intent: intentResult.intent,
      confidence: Math.min(confidence, intentResult.confidence), // usar a menor confiança
      entities: entitiesResult.entities,
      suggestedAction: action.action,
      shouldAddToCart: action.shouldAddToCart,
      shouldGenerateResponse: action.shouldGenerateResponse,
      shouldNotifyVendor: action.shouldNotifyVendor,
      cartItems: action.cartItems,
      responseText: action.responseText,
    };

    // Salvar resultado no banco para análise posterior
    try {
      // Se quiser, pode salvar em uma tabela de intent_logs
      // await this.prisma.intentLog.create({ data: response });
    } catch (error) {
      console.warn('Erro ao salvar log de intent:', error);
    }

    return response;
  }

  /**
   * Sugerir ação baseada na intenção e entidades
   */
  private suggestAction(
    intent: string,
    entities: EntityDto[],
    transcript: string,
  ): any {
    const action: any = {
      action: '',
      shouldAddToCart: false,
      shouldGenerateResponse: true,
      shouldNotifyVendor: false,
      cartItems: [],
      responseText: '',
    };

    switch (intent) {
      case 'COMPRA':
        // Extrair quantidade e produto
        const quantityEntity = entities.find((e) => e.type === 'QUANTIDADE');
        const productEntity = entities.find((e) => e.type === 'PRODUTO');

        if (productEntity) {
          action.shouldAddToCart = true;
          action.cartItems = [
            {
              productName: productEntity.value,
              quantity: quantityEntity ? parseInt(quantityEntity.value) : 1,
              confidence: productEntity.confidence,
            },
          ];
          action.action = 'Adicionar ao carrinho';
          action.responseText = `✓ Adicionei ${action.cartItems[0].quantity}x ${productEntity.value} ao seu carrinho`;
        } else {
          action.action = 'Pedir confirmação do produto';
          action.responseText = 'Qual produto você deseja? 👇';
        }
        break;

      case 'PERGUNTA':
      case 'CARDAPIO':
        action.action = 'Enviar cardápio';
        action.responseText = 'Aqui está nosso cardápio 📋';
        action.shouldGenerateResponse = true;
        break;

      case 'HORARIO':
        action.action = 'Responder horário de funcionamento';
        action.responseText = 'Atendemos de segunda a sexta, 10h às 18h 🕐';
        break;

      case 'LOCALIZACAO':
        action.action = 'Enviar localização';
        action.responseText = 'Nossa localização: Rua ABC, nº 123, São Paulo 📍';
        break;

      case 'CANCELAR_PEDIDO':
        action.action = 'Processar cancelamento';
        action.responseText =
          'Vou ajudá-lo a cancelar. Qual é o número do seu pedido?';
        action.shouldNotifyVendor = true;
        break;

      case 'RECLAMACAO':
        action.action = 'Direcionar para suporte';
        action.responseText =
          'Sinto muito com o problema. Vou te conectar com suporte agora.';
        action.shouldNotifyVendor = true;
        break;

      case 'SAUDACAO':
        action.action = 'Cumprimentar';
        action.responseText = 'Olá! 👋 Bem-vindo! Como posso ajudá-lo?';
        break;

      default:
        action.action = 'Resposta padrão';
        action.responseText =
          'Entendi! 😊 Como posso te ajudar com isso?';
    }

    return action;
  }

  /**
   * Detecção por fallback (palavras-chave quando Ollama falha)
   */
  private detectIntentFallback(text: string): DetectIntentResponseDto {
    const lowerText = text.toLowerCase();

    // Padrões simples em português
    const patterns = {
      COMPRA: /quero|preciso|comprar|leve|me d\w+|gostaria|prefiro|desejo/i,
      PERGUNTA: /qual|quanto|quando|onde|como|por qu\w|o que|me explica/i,
      CARDAPIO: /cardápio|menu|o que vocês vendem|o que têm|produtos/i,
      HORARIO: /horário|abre|fecha|funciona|atende|agora/i,
      RECLAMACAO: /problema|defeito|ruim|não funciona|reclamação/i,
      CANCELAR_PEDIDO: /cancelar|desistir|não quero mais/i,
      SAUDACAO: /oi|olá|opa|e aí|tudo bem|bom dia|boa tarde/i,
    };

    for (const [intent, pattern] of Object.entries(patterns)) {
      if (pattern.test(lowerText)) {
        return {
          intent,
          confidence: 0.65,
          entities: [],
          sentiment: 'neutro',
          suggestedAction: 'Ação automática',
          rawText: text,
          language: 'pt',
        };
      }
    }

    // Default fallback
    return {
      intent: 'PERGUNTA',
      confidence: 0.5,
      entities: [],
      sentiment: 'neutro',
      suggestedAction: 'Resposta padrão',
      rawText: text,
      language: 'pt',
    };
  }

  /**
   * Chama Ollama para processar texto
   */
  private async callOllama(prompt: string, model: string = 'mistral'): Promise<string> {
    try {
      const response = await this.httpService.axiosRef.post(
        `${this.ollamaApiUrl}/api/generate`,
        {
          model,
          prompt,
          stream: false,
          format: 'json', // Solicitar resposta em JSON
        },
        { timeout: 30000 },
      );

      return response.data.response || '';
    } catch (error) {
      console.error('Erro ao chamar Ollama:', error.message);
      throw error;
    }
  }

  /**
   * Parser robusto para JSON da resposta Ollama
   */
  private parseOllamaJson(response: string): any {
    try {
      // Tenta extrair JSON válido da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {};
    } catch (error) {
      console.warn('Erro ao fazer parse JSON:', error);
      return {};
    }
  }
}
