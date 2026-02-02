import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserCreateDto, UserPreferencesDto } from './dto/user.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * POST /users/create
   * Admin cria novo usuário
   */
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() dto: UserCreateDto) {
    return this.userService.createUser(dto);
  }

  /**
   * GET /users/:id
   * Obter dados do usuário
   */
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  /**
   * GET /users/email/:email
   * Buscar usuário por email
   */
  @Get('email/:email')
  async getUserByEmail(@Param('email') email: string) {
    // TODO: Add tenantId from request context
    return this.userService.findByEmail(email, '');
  }

  /**
   * POST /users/:id/preferences
   * Atualizar preferências do usuário
   */
  @Post(':id/preferences')
  async updatePreferences(
    @Param('id') userId: string,
    @Body() dto: UserPreferencesDto,
  ) {
    return this.userService.updatePreferences(userId, dto);
  }

  /**
   * POST /users/:id/activate
   * Ativar usuário (após onboarding)
   */
  @Post(':id/activate')
  async activateUser(@Param('id') userId: string) {
    return this.userService.activateUser(userId);
  }
}
