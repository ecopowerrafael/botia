import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { UserCreateDto, UserPreferencesDto, UserResponseDto } from './dto/user.dto';
import { UserStatus, UserRole, VendorMode } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(dto: UserCreateDto): Promise<UserResponseDto> {
    // Validar se usuário já existe
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        tenantId: dto.tenantId,
      },
    });

    if (existingUser) {
      throw new ConflictException('Usuário já existe com este email');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Criar usuário
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        role: dto.role,
        password: hashedPassword,
        status: UserStatus.PENDING_ONBOARDING,
        tenantId: dto.tenantId,
      },
      include: {
        preferences: true,
      },
    });

    return this.mapToResponseDto(user);
  }

  async findByEmail(email: string, tenantId: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        tenantId,
      },
      include: {
        preferences: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        preferences: true,
      },
    });
  }

  async updatePreferences(
    userId: string,
    dto: UserPreferencesDto,
  ): Promise<any> {
    const existingPreferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (existingPreferences) {
      return this.prisma.userPreferences.update({
        where: { userId },
        data: {
          operationMode: dto.operationMode || existingPreferences.operationMode,
          audioEnabled: dto.audioEnabled ?? existingPreferences.audioEnabled,
          audioLanguage: dto.audioLanguage || existingPreferences.audioLanguage,
          audioSpeed: dto.audioSpeed || existingPreferences.audioSpeed,
          language: dto.language || existingPreferences.language,
          timezone: dto.timezone || existingPreferences.timezone,
          notificationsEnabled:
            dto.notificationsEnabled ?? existingPreferences.notificationsEnabled,
        },
      });
    } else {
      return this.prisma.userPreferences.create({
        data: {
          userId,
          operationMode: dto.operationMode || VendorMode.SELLER,
          audioEnabled: dto.audioEnabled ?? true,
          audioLanguage: dto.audioLanguage || 'pt-BR',
          audioSpeed: dto.audioSpeed || 1.0,
          language: dto.language || 'pt-BR',
          timezone: dto.timezone || 'America/Sao_Paulo',
          notificationsEnabled: dto.notificationsEnabled ?? true,
        },
      });
    }
  }

  async activateUser(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
      },
      include: {
        preferences: true,
      },
    });

    return this.mapToResponseDto(user);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private mapToResponseDto(user: any): UserResponseDto {
    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      preferences: user.preferences
        ? {
            operationMode: user.preferences.operationMode,
            audioEnabled: user.preferences.audioEnabled,
            audioLanguage: user.preferences.audioLanguage,
            audioSpeed: user.preferences.audioSpeed,
            language: user.preferences.language,
            timezone: user.preferences.timezone,
            notificationsEnabled: user.preferences.notificationsEnabled,
          }
        : undefined,
    };
  }
}
