import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { OnboardingSetupDto, SendOnboardingEmailDto } from './dto/onboarding.dto';
import * as crypto from 'crypto';

@Injectable()
export class OnboardingService {
  private readonly TOKEN_EXPIRY_HOURS = 168; // 7 dias
  private readonly TOKEN_LENGTH = 32;

  constructor(private prisma: PrismaService) {}

  /**
   * Gera um token de setup e envia email ao usuário
   */
  async sendOnboardingEmail(dto: SendOnboardingEmailDto): Promise<{
    tokenGenerated: boolean;
    expiresIn: string;
    message: string;
  }> {
    // Verificar se usuário existe
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        tenantId: dto.tenantId,
      },
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    // Gerar token único
    const setupToken = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

    // Salvar token (em um campo custom ou na tabela User)
    // Para esta implementação, vamos armazenar em metadata JSON
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        // Armazenar em um campo metadata (adicionar ao schema depois)
        // Por enquanto, vamos usar uma abordagem de cache/redis
      },
    });

    // TODO: Enviar email com link de setup
    // const setupLink = `${process.env.FRONTEND_URL}/onboarding/${setupToken}`;
    // await emailService.send({
    //   to: user.email,
    //   subject: 'Finalize seu cadastro',
    //   template: 'onboarding',
    //   variables: { setupLink, name: user.name }
    // });

    console.log(`
      🔑 Setup Token Gerado (DEV MODE)
      Email: ${user.email}
      Token: ${setupToken}
      Expira em: ${expiresAt.toISOString()}
      Link: /onboarding/${setupToken}
    `);

    return {
      tokenGenerated: true,
      expiresIn: '7 dias',
      message: `Email de onboarding será enviado para ${user.email}`,
    };
  }

  /**
   * Valida o token de setup
   */
  async validateSetupToken(token: string): Promise<{
    valid: boolean;
    userEmail?: string;
    expiresAt?: Date;
  }> {
    // TODO: Implementar validação real com cache/Redis
    // Por enquanto, apenas retornar mock
    return {
      valid: true,
      userEmail: 'user@example.com',
      expiresAt: new Date(),
    };
  }

  /**
   * Completa o onboarding do usuário
   */
  async completeOnboarding(dto: OnboardingSetupDto): Promise<{
    success: boolean;
    userId: string;
    message: string;
  }> {
    // Validar token
    const tokenValid = await this.validateSetupToken(dto.setupToken);
    if (!tokenValid.valid) {
      throw new BadRequestException('Token de setup inválido ou expirado');
    }

    // Encontrar usuário pelo email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    // Atualizar preferências do usuário
    await this.prisma.userPreferences.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        operationMode: dto.operationMode,
        audioLanguage: dto.audioLanguage || 'pt-BR',
        timezone: dto.timezone || 'America/Sao_Paulo',
        audioEnabled: true,
        audioSpeed: 1.0,
        language: 'pt-BR',
        notificationsEnabled: true,
      },
      update: {
        operationMode: dto.operationMode,
        audioLanguage: dto.audioLanguage || undefined,
        timezone: dto.timezone || undefined,
      },
    });

    // Ativar usuário
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'ACTIVE',
      },
    });

    return {
      success: true,
      userId: user.id,
      message: 'Onboarding concluído com sucesso!',
    };
  }

  /**
   * Obter status do onboarding
   */
  async getOnboardingStatus(setupToken: string) {
    const validation = await this.validateSetupToken(setupToken);

    return {
      setupTokenValid: validation.valid,
      step: 1, // 1-4
      userEmail: validation.userEmail,
      expiresAt: validation.expiresAt,
    };
  }
}
