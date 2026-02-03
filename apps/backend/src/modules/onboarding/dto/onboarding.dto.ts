import { IsEmail, IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { VendorMode } from '../../../shared/enums';

export class OnboardingSetupDto {
  @IsString()
  setupToken: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(VendorMode)
  operationMode: VendorMode;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  audioLanguage?: string;
}

export class OnboardingStatusDto {
  setupTokenValid: boolean;
  step: number; // 1-4
  userEmail: string;
  expiresAt: Date;
}

export class SendOnboardingEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  tenantId: string;
}
