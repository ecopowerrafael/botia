import { IsEmail, IsString, IsEnum, IsOptional, IsPhoneNumber, MinLength } from 'class-validator';
import { UserRole, VendorMode } from '../../../shared/enums';

export class UserCreateDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsPhoneNumber('BR')
  phone?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  tenantId: string;
}

export class UserPreferencesDto {
  @IsEnum(VendorMode)
  operationMode: VendorMode;

  @IsOptional()
  audioEnabled?: boolean;

  @IsOptional()
  @IsString()
  audioLanguage?: string; // 'pt-BR', 'en-US'

  @IsOptional()
  audioSpeed?: number; // 0.5 ~ 2.0

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  notificationsEnabled?: boolean;
}

export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  status: string;
  preferences?: UserPreferencesDto;
  createdAt: Date;
  updatedAt: Date;
}
