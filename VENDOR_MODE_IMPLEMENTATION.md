# 🛍️ Implementação: Modo Vendedor com Integração WhatsApp

## 📋 Requisitos Detalhados

```
✅ Estratégia 2 (Database - PERSISTENTE)
✅ Modo Vendedor vs Atendente
✅ Finalizar pedido com envio para WhatsApp
✅ Preparar estrutura para impressão de pedidos
✅ Análise de PDFs/Imagens de comprovantes com IA
```

---

## 🏗️ Arquitetura Expandida

### 1. Tipos de Usuário/Modo

```typescript
enum UserRole {
  ADMIN = 'ADMIN',           // Acesso total
  VENDOR = 'VENDOR',         // Modo vendedor (recebe pedidos)
  ATTENDANT = 'ATTENDANT',   // Modo atendente (suporte)
  CUSTOMER = 'CUSTOMER'      // Cliente
}

enum VendorMode {
  SELLER = 'SELLER',         // Vende produtos (compra → pagamento)
  SERVICE = 'SERVICE',       // Serviços (agendamentos)
  SUPPORT = 'SUPPORT'        // Suporte (tickets)
}
```

### 2. Modelo Expandido Prisma

```prisma
// Adicionar ao Tenant para configuração de modo
model Tenant {
  id                    String   @id @default(uuid())
  name                  String
  
  // ===== NOVO: Modo de Operação =====
  operationMode         VendorMode @default(SELLER)
  vendorPhone           String?          // WhatsApp do vendedor
  enableInvoices        Boolean  @default(false)  // Gerar recibos
  invoiceTemplate       String?          // Template de recibo
  // ====================================
  
  // Relações existentes
  apiKeys               ApiKey[]
  users                 User[]
  products              Product[]
  chats                 Chat[]
  orders                Order[]
  whatsAppInstances     WhatsAppInstance[]
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

// Atualizar User com role
model User {
  id                    String   @id @default(uuid())
  tenantId              String   @db.Uuid
  tenant                Tenant   @relation(fields: [tenantId], references: [id])
  
  email                 String
  name                  String
  
  // ===== NOVO: Role do usuário =====
  role                  UserRole @default(CUSTOMER)
  // ==================================
  
  whatsAppInstances     WhatsAppInstance[]
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@unique([tenantId, email])
}

// Modelo Order expandido
model Order {
  id                    String   @id @default(uuid())
  tenantId              String   @db.Uuid
  tenant                Tenant   @relation(fields: [tenantId], references: [id])
  
  chatId                String   @db.Uuid
  chat                  Chat     @relation(fields: [chatId], references: [id])
  
  contactId             String   @db.Uuid
  contact               Contact  @relation(fields: [contactId], references: [id])
  
  // ===== NOVO: Campos de vendedor =====
  vendorId              String?  @db.Uuid
  vendor                User?    @relation("vendor_orders", fields: [vendorId], references: [id])
  
  status                OrderStatus @default(DRAFT)
  paymentStatus         PaymentStatus @default(PENDING)
  paymentMethod         String?       // PIX, CREDIT_CARD, BOLETO, etc
  paymentProof          PaymentProof?
  
  // Envio para WhatsApp
  sentToVendor          Boolean  @default(false)
  sentToVendorAt        DateTime?
  vendorOrderNumber     String?        // Número para rastreamento
  invoiceUrl            String?        // URL do recibo/NF-e
  invoiceData           Json?          // JSON da nota fiscal
  
  // ========================================
  
  items                 OrderItem[]
  
  subtotal              Decimal  @default(0)
  tax                   Decimal  @default(0)
  discount              Decimal  @default(0)
  total                 Decimal  @default(0)
  
  notes                 String?
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  confirmedAt           DateTime?
  
  @@index([tenantId, paymentStatus])
  @@index([vendorId])
}

enum OrderStatus {
  DRAFT
  CONFIRMED
  PENDING_PAYMENT
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PROCESSING
  PAID
  FAILED
  REFUNDED
}

// Novo modelo: Comprovante de pagamento
model PaymentProof {
  id                    String   @id @default(uuid())
  orderId               String   @db.Uuid
  order                 Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  proofType             String   // "PIX_RECEIPT", "BANK_SLIP", "SCREENSHOT", etc
  proofUrl              String   // URL da imagem/PDF
  proofData             Json?    // Dados extraídos da imagem (AI parsed)
  
  // ===== NOVO: Validação de comprovante =====
  isVerified            Boolean  @default(false)
  verifiedBy            String?  // Email do admin que validou
  verifiedAt            DateTime?
  verificationNotes     String?  // Motivo se rejeitado
  // ==========================================
  
  uploadedAt            DateTime @default(now())
  
  @@unique([orderId])
}

// Novo modelo: Configuração WhatsApp por Tenant
model TenantWhatsAppConfig {
  id                    String   @id @default(uuid())
  tenantId              String   @db.Uuid
  tenant                Tenant   @relation(fields: [tenantId], references: [id])
  
  vendorPhoneNumber     String   // WhatsApp do vendedor (com +55)
  vendorPhoneName       String   // Nome que aparece na agenda
  
  autoSendOrder         Boolean  @default(true)  // Enviar automaticamente pedido finalizado
  includePaymentProof   Boolean  @default(true)  // Incluir link para comprovar pagamento
  invoiceTemplate       String?  // HTML template para recibo
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@unique([tenantId])
}

enum VendorMode {
  SELLER
  SERVICE
  SUPPORT
}

enum UserRole {
  ADMIN
  VENDOR
  ATTENDANT
  CUSTOMER
}
```

---

## 🔄 Fluxo: Modo Vendedor

```
CLIENTE                    BOT                        VENDEDOR
                                                      (WhatsApp)

"Qual o preço?"
    ↓
                ← Busca no WordPress
    ← "R$ 45"

"Quero 2"
    ↓
            ← Detecta QUANTITY
            ← Cria Order DRAFT
            ← Salva no Redis + BD
    ← "Adicionado! Total: R$ 90"

"Confirma"
    ↓
            ← Detecta CONFIRM
            ← Order: DRAFT → CONFIRMED
            ← Gera número de pedido
            ← Gera recibo (opcional)
    ← "Pedido #2501-0001 confirmado!
       Total: R$ 90
       
       Pix: abc...xyz
       
       Envie o comprovante para confirmar"

[Cliente envia imagem
do PIX]
    ↓
            ← Recebe comprovante
            ← Analisa com IA (Ollama)
            ← Extrai dados (valor, horário)
            ← Valida automaticamente
            ← Order: PENDING → PAID
    ← "Pagamento validado! ✓
       Processando seu pedido..."

            ← Prepara mensagem WhatsApp
            ← Envia para vendedor:
               "Novo pedido! #2501-0001
                Cliente: João
                Itens: 2x Vinho (R$ 90)
                
                Comprovante: [link]
                [botão confirmar recebimento]"
                                        
                                    [Vendedor vê]
                                    [Clica confirmar]
                                    
                                        ↓
            ← Webhook recebe confirmação
            ← Order: PAID → PROCESSING
    ← "Seu pedido foi recebido
       pelo vendedor! Agora é só
       aguardar a entrega 📦"
```

---

## 🤖 IA Lendo Comprovante de Pagamento

### Resposta: SIM! Ollama consegue (com limitações)

```
┌─────────────────────────────────────────────┐
│ IA GRATUITA: Análise de Imagens/PDFs        │
├─────────────────────────────────────────────┤
│                                              │
│ ✅ Ollama (Local)                            │
│    Models: llava, llava-phi, bakllava       │
│    - Analisa IMAGENS (PNG, JPG)             │
│    - OCR básico (ler números)               │
│    - Limitado a ~2048 pixels                │
│    - Lento (5-30s por imagem)               │
│    - NÃO lê PDF diretamente                 │
│                                              │
│ ✅ LLaVA (via Ollama)                        │
│    - Melhor custo-benefício                 │
│    - Consegue ler:                          │
│      • Screenshots de PIX                   │
│      • Comprovantes bancários               │
│      • Faturas simples                      │
│    - Extrair: valor, data, id_transação    │
│                                              │
│ ❌ Limitações                                │
│    - Imagens > 2MB: falha                   │
│    - PDFs: precisa converter para PNG       │
│    - Caracteres manuscritos: baixa precisão│
│    - QR codes: não consegue decodificar     │
│                                              │
│ ✅ Solução: PDF → PNG → Ollama              │
│    Usar: pdf2image (Python)                 │
│    Flow: Upload PDF → Converter → OCR       │
└─────────────────────────────────────────────┘
```

### Implementação: Análise de Comprovante com Ollama

```typescript
// payment.service.ts

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ollama: OllamaService, // seu serviço Ollama existente
  ) {}

  /**
   * Processar comprovante de pagamento
   * Suporta: PNG, JPG, PDF (convertido para PNG)
   */
  async processPaymentProof(
    orderId: string,
    proofFile: Express.Multer.File,
    proofType: string, // "PIX_RECEIPT", "BANK_SLIP"
  ) {
    try {
      // [1] Validar arquivo
      const validTypes = ['image/png', 'image/jpeg', 'application/pdf'];
      if (!validTypes.includes(proofFile.mimetype)) {
        throw new Error('Tipo de arquivo não suportado');
      }

      // [2] Salvar arquivo temporariamente
      const uploadDir = './uploads/payment-proofs';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filename = `${orderId}-${Date.now()}`;
      let imagePath = path.join(uploadDir, `${filename}.png`);

      // Se for PDF, converter para PNG
      if (proofFile.mimetype === 'application/pdf') {
        imagePath = await this.convertPdfToImage(
          proofFile.buffer,
          imagePath,
        );
      } else {
        fs.writeFileSync(imagePath, proofFile.buffer);
      }

      // [3] Redimensionar imagem (Ollama melhor com < 2MB)
      const resizedPath = await this.optimizeImage(imagePath);

      // [4] Enviar para Ollama LLaVA para análise
      const extractedData = await this.analyzeReceiptWithOllama(
        resizedPath,
        proofType,
      );

      // [5] Validar dados extraídos
      const validationResult = await this.validatePaymentData(
        extractedData,
        orderId,
      );

      // [6] Salvar comprovante no banco
      const paymentProof = await this.prisma.paymentProof.create({
        data: {
          orderId,
          proofType,
          proofUrl: imagePath,
          proofData: extractedData,
          isVerified: validationResult.isValid,
          verificationNotes: validationResult.message,
        },
      });

      // [7] Se validado automaticamente, atualizar Order
      if (validationResult.isValid) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'PAID',
            status: 'PROCESSING',
          },
        });
      }

      return {
        success: true,
        proof: paymentProof,
        validation: validationResult,
      };
    } catch (error) {
      this.logger.error(`Payment proof error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Converter PDF para PNG usando ffmpeg ou similar
   */
  private async convertPdfToImage(
    pdfBuffer: Buffer,
    outputPath: string,
  ): Promise<string> {
    // Opção 1: Usar pdf2image (requer imagemagick/ghostscript)
    // Opção 2: Usar PDFKit
    // Opção 3: Usar servidor PDF externo

    // Simplificado: assumindo que você tem pdf2image instalado
    const tempPdfPath = outputPath.replace('.png', '.pdf');
    fs.writeFileSync(tempPdfPath, pdfBuffer);

    // Usar execSync para chamar pdf2image
    const { execSync } = require('child_process');
    try {
      execSync(
        `convert -density 150 "${tempPdfPath}" -quality 85 "${outputPath}"`,
      );
      fs.unlinkSync(tempPdfPath);
      return outputPath;
    } catch (error) {
      this.logger.error('PDF conversion failed');
      throw new Error('Falha ao processar PDF');
    }
  }

  /**
   * Otimizar tamanho da imagem para Ollama
   */
  private async optimizeImage(imagePath: string): Promise<string> {
    const { execSync } = require('child_process');
    const optimizedPath = imagePath.replace('.png', '-optimized.png');

    try {
      // Redimensionar para max 1024px e comprimir
      execSync(
        `convert "${imagePath}" -resize 1024x1024\\> -quality 85 "${optimizedPath}"`,
      );
      fs.unlinkSync(imagePath);
      return optimizedPath;
    } catch (error) {
      this.logger.warn('Image optimization failed, using original');
      return imagePath;
    }
  }

  /**
   * Análise com Ollama LLaVA
   * Extrai: valor, data, ID transação, nome banco, etc
   */
  private async analyzeReceiptWithOllama(
    imagePath: string,
    proofType: string,
  ): Promise<any> {
    const imageBase64 = fs.readFileSync(imagePath, 'base64');

    const prompts = {
      PIX_RECEIPT: `Analise esta imagem de comprovante PIX e extraia:
        1. Valor transferido (em números)
        2. Data e hora
        3. Tipo de chave PIX (CPF, Email, Aleatória, Telefone)
        4. Nome do banco ou aplicativo
        5. ID ou código de transação (se visível)
        
        Formato de resposta JSON:
        {
          "amount": 0.00,
          "datetime": "2026-02-01T10:30:00",
          "pixKeyType": "CPF|EMAIL|RANDOM|PHONE",
          "bank": "nome do banco",
          "transactionId": "id",
          "confidence": 0.95
        }`,

      BANK_SLIP: `Analise este boleto/TED bancário e extraia:
        1. Valor
        2. Data de vencimento
        3. Código do banco
        4. Nosso número
        5. Seu número
        
        Formato de resposta JSON:
        {
          "amount": 0.00,
          "dueDate": "2026-02-05",
          "bankCode": "123",
          "ourNumber": "xxx",
          "customerNumber": "xxx",
          "confidence": 0.95
        }`,

      SCREENSHOT: `Analise este screenshot e extraia qualquer informação de transação:
        1. Valor
        2. Data
        3. ID transação
        4. Status
        
        Formato de resposta JSON:
        {
          "amount": 0.00,
          "datetime": "2026-02-01T10:30:00",
          "transactionId": "id",
          "status": "SUCCESS|PENDING|FAILED",
          "confidence": 0.85
        }`,
    };

    const prompt = prompts[proofType] || prompts.SCREENSHOT;

    try {
      // Chamar Ollama com imagem
      const response = await this.ollama.generateWithImage(
        'llava',
        prompt,
        imageBase64,
      );

      // Parse resposta JSON da IA
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta IA inválida');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error(`Ollama analysis failed: ${error.message}`);
      return {
        amount: null,
        datetime: null,
        transactionId: null,
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * Validar dados do comprovante
   */
  private async validatePaymentData(
    extractedData: any,
    orderId: string,
  ): Promise<{ isValid: boolean; message: string }> {
    try {
      // Buscar order para comparar valor
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        return {
          isValid: false,
          message: 'Pedido não encontrado',
        };
      }

      // Regra 1: Valor deve corresponder (com tolerância de 5%)
      const tolerance = order.total * 0.05; // 5%
      if (!extractedData.amount) {
        return {
          isValid: false,
          message: 'Não consegui ler o valor da imagem',
        };
      }

      const valueDifference = Math.abs(
        Number(extractedData.amount) - Number(order.total),
      );

      if (valueDifference > tolerance) {
        return {
          isValid: false,
          message: `Valor incompatível. Esperado: R$ ${order.total}, recebido: R$ ${extractedData.amount}`,
        };
      }

      // Regra 2: Data não pode ser anterior a agora - 1 dia
      if (extractedData.datetime) {
        const proofDate = new Date(extractedData.datetime);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        if (proofDate < oneDayAgo) {
          return {
            isValid: false,
            message: 'Comprovante com data muito antiga',
          };
        }
      }

      // Regra 3: Confidence > 80%
      if (extractedData.confidence < 0.8) {
        return {
          isValid: false,
          message: `Qualidade baixa da imagem (${(extractedData.confidence * 100).toFixed(0)}%)`,
        };
      }

      // Passou em todas as validações
      return {
        isValid: true,
        message: `✓ Validado! Valor R$ ${extractedData.amount}, ID: ${extractedData.transactionId}`,
      };
    } catch (error) {
      return {
        isValid: false,
        message: `Erro na validação: ${error.message}`,
      };
    }
  }
}
```

---

## 📱 Envio de Pedido para WhatsApp do Vendedor

### Serviço de Notificação

```typescript
// vendor-notification.service.ts

@Injectable()
export class VendorNotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
    private readonly logger: Logger = new Logger(VendorNotificationService.name),
  ) {}

  /**
   * Enviar novo pedido para WhatsApp do vendedor
   */
  async sendOrderToVendor(orderId: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          contact: true,
          chat: true,
          tenant: true,
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // [1] Buscar configuração de WhatsApp do vendedor
      const config = await this.prisma.tenantWhatsAppConfig.findUnique({
        where: { tenantId: order.tenantId },
      });

      if (!config) {
        this.logger.warn(
          `No vendor phone configured for tenant ${order.tenantId}`,
        );
        return;
      }

      // [2] Montar mensagem formatada
      const message = this.formatOrderMessage(order, config);

      // [3] Gerar recibo (se habilitado)
      let invoiceUrl: string | null = null;
      if (config.invoiceTemplate) {
        invoiceUrl = await this.generateInvoice(order, config);
      }

      // [4] Gerar link para validar comprovante
      const proofLink = this.generateProofLink(order);

      // [5] Enviar via WhatsApp
      const whatsappResult = await this.sendViaWhatsApp(
        config.vendorPhoneNumber,
        message,
        invoiceUrl,
        proofLink,
        order,
      );

      // [6] Marcar como enviado
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          sentToVendor: true,
          sentToVendorAt: new Date(),
          vendorOrderNumber: this.generateOrderNumber(order),
          invoiceUrl,
        },
      });

      this.logger.log(`Order sent to vendor: ${orderId}`);
      return whatsappResult;
    } catch (error) {
      this.logger.error(`Failed to send order to vendor: ${error.message}`);
      throw error;
    }
  }

  /**
   * Formatar mensagem do pedido
   */
  private formatOrderMessage(order: any, config: any): string {
    const itemsList = order.items
      .map(
        (item) =>
          `• ${item.productName}\n  ${item.quantity}x R$ ${Number(item.unitPrice).toFixed(2)} = R$ ${Number(item.subtotal).toFixed(2)}`,
      )
      .join('\n');

    const orderNumber = this.generateOrderNumber(order);

    return `
🎯 *NOVO PEDIDO!*

*Número: #${orderNumber}*
*Cliente: ${order.contact?.name || 'Anônimo'}*
*WhatsApp: ${order.contact?.whatsAppPhone || 'N/A'}*

📦 *Itens:*
${itemsList}

💰 *Valor:*
Subtotal: R$ ${Number(order.subtotal).toFixed(2)}
Desconto: R$ ${Number(order.discount).toFixed(2)}
*Total: R$ ${Number(order.total).toFixed(2)}*

⏰ *Data:* ${new Date(order.createdAt).toLocaleString('pt-BR')}

👇 *Ações:*
[Botão: Ver Comprovante]
[Botão: Confirmar Recebimento]
[Botão: Rejeitar Pedido]
    `.trim();
  }

  /**
   * Gerar número de pedido (e.g., 2501-0001)
   */
  private generateOrderNumber(order: any): string {
    const month = new Date(order.createdAt).getMonth() + 1;
    const year = new Date(order.createdAt).getFullYear() % 100;
    const sequence = order.id.substring(0, 4).toUpperCase();
    return `${year}${String(month).padStart(2, '0')}-${sequence}`;
  }

  /**
   * Gerar recibo em HTML/PDF
   */
  private async generateInvoice(order: any, config: any): Promise<string> {
    // Usar template configurado ou padrão
    const template = config.invoiceTemplate || this.getDefaultTemplate();

    const itemsHtml = order.items
      .map(
        (item) => `
      <tr>
        <td>${item.productName}</td>
        <td align="center">${item.quantity}</td>
        <td align="right">R$ ${Number(item.unitPrice).toFixed(2)}</td>
        <td align="right">R$ ${Number(item.subtotal).toFixed(2)}</td>
      </tr>
    `,
      )
      .join('');

    const html = template
      .replace('{{orderNumber}}', this.generateOrderNumber(order))
      .replace('{{clientName}}', order.contact?.name || 'Cliente')
      .replace('{{clientPhone}}', order.contact?.whatsAppPhone || 'N/A')
      .replace('{{date}}', new Date(order.createdAt).toLocaleString('pt-BR'))
      .replace('{{itemsTable}}', itemsHtml)
      .replace('{{subtotal}}', Number(order.subtotal).toFixed(2))
      .replace('{{discount}}', Number(order.discount).toFixed(2))
      .replace('{{total}}', Number(order.total).toFixed(2));

    // Converter HTML → PDF (usar puppeteer ou similar)
    const pdfBuffer = await this.htmlToPdf(html);
    const filename = `invoice-${order.id}.pdf`;
    const filepath = `/invoices/${filename}`;

    // Salvar em storage (S3, local, etc)
    await this.saveToStorage(filepath, pdfBuffer);

    return `${process.env.BASE_URL}${filepath}`;
  }

  /**
   * Gerar link para comprovante de pagamento
   */
  private generateProofLink(order: any): string {
    const token = this.generateSecureToken(order.id);
    return `${process.env.BASE_URL}/payment-proof/${order.id}?token=${token}`;
  }

  /**
   * Enviar via WhatsApp
   */
  private async sendViaWhatsApp(
    vendorPhone: string,
    message: string,
    invoiceUrl: string | null,
    proofLink: string,
    order: any,
  ) {
    // Usar serviço WhatsApp existente (Evolution API ou similar)
    const mediaUrls = [];
    if (invoiceUrl) {
      mediaUrls.push(invoiceUrl);
    }

    // Adicionar botões interativos
    const buttons = [
      {
        id: `proof_${order.id}`,
        title: 'Ver Comprovante',
        type: 'url',
        url: proofLink,
      },
      {
        id: `confirm_${order.id}`,
        title: 'Confirmar Recebimento',
        type: 'reply',
      },
      {
        id: `reject_${order.id}`,
        title: 'Rejeitar Pedido',
        type: 'reply',
      },
    ];

    return await this.whatsappService.sendMessageWithButtons(
      vendorPhone,
      message,
      buttons,
      mediaUrls,
    );
  }

  private getDefaultTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial">
        <h2>Recibo Pedido #{{orderNumber}}</h2>
        <p><strong>Cliente:</strong> {{clientName}}</p>
        <p><strong>Telefone:</strong> {{clientPhone}}</p>
        <p><strong>Data:</strong> {{date}}</p>
        
        <table border="1" cellpadding="10" style="width:100%">
          <tr>
            <th>Produto</th>
            <th>Qtd</th>
            <th>Preço</th>
            <th>Total</th>
          </tr>
          {{itemsTable}}
        </table>
        
        <hr>
        <p align="right">
          <strong>Subtotal:</strong> R$ {{subtotal}}<br>
          <strong>Desconto:</strong> R$ {{discount}}<br>
          <strong>TOTAL: R$ {{total}}</strong>
        </p>
      </body>
      </html>
    `;
  }

  private async htmlToPdf(html: string): Promise<Buffer> {
    // Implementar com puppeteer ou similar
    // Por enquanto, placeholder
    throw new Error('PDF generation not implemented');
  }

  private async saveToStorage(filepath: string, buffer: Buffer): Promise<void> {
    // Salvar em S3, local filesystem, etc
    // Placeholder
  }

  private generateSecureToken(orderId: string): string {
    // Gerar token JWT com expiração de 24h
    return 'token_placeholder';
  }
}
```

---

## 🔗 Webhook: Resposta do Vendedor

```typescript
// vendor.controller.ts

@Controller('vendor')
export class VendorController {
  constructor(
    private readonly vendorService: VendorNotificationService,
    private readonly orderService: OrderService,
  ) {}

  /**
   * Webhook: Vendedor confirma recebimento
   */
  @Post('confirm-order/:orderId')
  async confirmOrder(@Param('orderId') orderId: string) {
    await this.orderService.updateOrderStatus(
      orderId,
      'PROCESSING',
      'Vendedor confirmou recebimento',
    );

    return {
      message: 'Pedido confirmado com sucesso',
      orderId,
    };
  }

  /**
   * Webhook: Vendedor rejeita pedido
   */
  @Post('reject-order/:orderId')
  async rejectOrder(
    @Param('orderId') orderId: string,
    @Body() dto: { reason?: string },
  ) {
    await this.orderService.updateOrderStatus(
      orderId,
      'CANCELLED',
      `Rejeitado: ${dto.reason || 'Sem informação'}`,
    );

    return {
      message: 'Pedido rejeitado',
      orderId,
    };
  }

  /**
   * Webhook: Pedido marcado como entregue
   */
  @Post('mark-delivered/:orderId')
  async markDelivered(@Param('orderId') orderId: string) {
    await this.orderService.updateOrderStatus(
      orderId,
      'DELIVERED',
      'Pedido entregue',
    );

    return {
      message: 'Pedido marcado como entregue',
      orderId,
    };
  }

  /**
   * Endpoint: Upload de comprovante de pagamento
   */
  @Post('payment-proof/:orderId')
  @UseInterceptors(FileInterceptor('proof'))
  async uploadPaymentProof(
    @Param('orderId') orderId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('proofType') proofType: string,
  ) {
    const payment = new PaymentService(null, null); // injected
    return await payment.processPaymentProof(orderId, file, proofType);
  }
}
```

---

## 📊 Fluxo Completo com Modo Vendedor

```
┌──────────────────────────────────────────────────────────────────┐
│                    CLIENTE (WhatsApp Bot)                         │
├──────────────────────────────────────────────────────────────────┤

1️⃣  "Qual o preço do vinho?"
    → detectIntent: PRICE_CHECK
    → resposta: "R$ 45"

2️⃣  "Quero 2 garrafas"
    → detectIntent: QUANTITY
    → creates Order (DRAFT)
    → resposta: "Adicionado! Total R$ 90"

3️⃣  "Confirma"
    → detectIntent: CONFIRM
    → Order: DRAFT → CONFIRMED
    → geraN° pedido: "2501-0001"
    → resposta: "PIX: abc...xyz, envie comprovante"

4️⃣  [Cliente envia imagem PIX]
    → Ollama analisa imagem
    → Extrai: valor R$ 90, hora 10:30, ID transação
    → Valida automaticamente
    → Order: PENDING_PAYMENT → PAID
    → resposta: "✓ Pagamento validado!"

5️⃣  [Sistema envia para Vendedor]
    → Webhook chamado: sendOrderToVendor()
    → Monta mensagem formatada
    → Gera recibo PDF
    → Envia WhatsApp com botões
    → Marca Order.sentToVendor = true
    
└──────────────────────────────────────────────────────────────────┘
                              ↓↓↓
┌──────────────────────────────────────────────────────────────────┐
│                   VENDEDOR (WhatsApp)                             │
├──────────────────────────────────────────────────────────────────┤

📲 Recebe:
   🎯 NOVO PEDIDO!
   
   Número: #2501-0001
   Cliente: João Silva
   WhatsApp: 11-98765-4321
   
   📦 Itens:
   • Vinho Tinto
     2x R$ 45.00 = R$ 90.00
   
   💰 Total: R$ 90.00
   
   [Botão: Ver Comprovante] → abre PDF
   [Botão: Confirmar Recebimento] → webhook
   [Botão: Rejeitar Pedido] → webhook

🖱️ Clica: "Confirmar Recebimento"
   → Webhook: PAID → PROCESSING
   → Cliente recebe: "Seu pedido foi recebido!"

└──────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Checklist de Implementação

```
FASE 1: Database & Models
  [ ] Adicionar campos a Tenant (operationMode, vendorPhone)
  [ ] Adicionar role a User
  [ ] Criar models Order expandido
  [ ] Criar PaymentProof model
  [ ] Criar TenantWhatsAppConfig model
  [ ] Run: npx prisma migrate dev --name add_vendor_mode

FASE 2: Payment & Validation
  [ ] Criar PaymentService
  [ ] Integrar Ollama para análise de imagem
  [ ] Implementar validação de comprovante
  [ ] Criar controller de upload

FASE 3: Vendor Notification
  [ ] Criar VendorNotificationService
  [ ] Implementar geração de recibo HTML
  [ ] Integrar WhatsApp com botões
  [ ] Criar webhooks de resposta

FASE 4: Order Status
  [ ] Criar OrderService com transições de status
  [ ] Implementar auditoria de mudanças
  [ ] Criar endpoints de status

FASE 5: Testing
  [ ] Teste fluxo completo
  [ ] Teste análise de imagem
  [ ] Teste envio WhatsApp
  [ ] Teste webhooks
```

---

## 🎯 Resumo Técnico

| Aspecto | Detalhes |
|---------|----------|
| **Modo Vendedor** | Flag `VendorMode` + `UserRole` |
| **WhatsApp Vendedor** | `TenantWhatsAppConfig.vendorPhoneNumber` |
| **Comprovante** | `PaymentProof` + Ollama (imagem) |
| **Análise IA** | Ollama LLaVA (local, gratuito) |
| **Suporte a PDF** | Sim (converte para PNG antes) |
| **Limitações PDF** | Max 2MB, precisa conversão |
| **Validação** | Valor + Data + Confiança (80%+) |
| **Notificação** | WhatsApp com botões interativos |
| **Recibo** | HTML → PDF com puppeteer |
| **Escalabilidade** | Suporta múltiplos vendedores |

---

**Próximo passo:** Quer que eu comece pela Fase 1 (atualizar schema Prisma) ou prefere começar por outra fase?

Ou quer testar antes a análise de imagem com Ollama? Posso criar um teste rápido.
