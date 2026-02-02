import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingSetupDto, SendOnboardingEmailDto } from './dto/onboarding.dto';

@Controller('onboarding')
export class OnboardingController {
  constructor(private onboardingService: OnboardingService) {}

  /**
   * POST /onboarding/send-email
   * Admin envia email de onboarding para novo usuário
   */
  @Post('send-email')
  @HttpCode(HttpStatus.OK)
  async sendOnboardingEmail(@Body() dto: SendOnboardingEmailDto) {
    return this.onboardingService.sendOnboardingEmail(dto);
  }

  /**
   * GET /onboarding/status/:token
   * Verificar status do token de setup
   */
  @Get('status/:token')
  async getStatus(@Param('token') token: string) {
    return this.onboardingService.getOnboardingStatus(token);
  }

  /**
   * POST /onboarding/complete
   * Usuário completa setup (escolhe modo, preferências, etc)
   * 
   * Body:
   * {
   *   setupToken: "abc123...",
   *   email: "user@example.com",
   *   password: "secure_password",
   *   operationMode: "SELLER" | "SERVICE" | "SUPPORT",
   *   timezone: "America/Sao_Paulo",
   *   audioLanguage: "pt-BR"
   * }
   */
  @Post('complete')
  @HttpCode(HttpStatus.OK)
  async completeOnboarding(@Body() dto: OnboardingSetupDto) {
    return this.onboardingService.completeOnboarding(dto);
  }

  /**
   * GET /onboarding/validate/:token
   * Validar se token é válido (ex: para frontend validar antes de form)
   */
  @Get('validate/:token')
  async validateToken(@Param('token') token: string) {
    return this.onboardingService.validateSetupToken(token);
  }
}
