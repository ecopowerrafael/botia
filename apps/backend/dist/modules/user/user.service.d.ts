import { PrismaService } from '../../shared/prisma.service';
import { UserCreateDto, UserPreferencesDto, UserResponseDto } from './dto/user.dto';
export declare class UserService {
    private prisma;
    constructor(prisma: PrismaService);
    createUser(dto: UserCreateDto): Promise<UserResponseDto>;
    findByEmail(email: string, tenantId: string): Promise<any>;
    findById(id: string): Promise<any>;
    updatePreferences(userId: string, dto: UserPreferencesDto): Promise<any>;
    activateUser(userId: string): Promise<UserResponseDto>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    private mapToResponseDto;
}
