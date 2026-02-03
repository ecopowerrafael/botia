import { PrismaService } from '../../shared/prisma.service';
import { OnboardingSetupDto, SendOnboardingEmailDto } from './dto/onboarding.dto';
export declare class OnboardingService {
    private prisma;
    private readonly TOKEN_EXPIRY_HOURS;
    private readonly TOKEN_LENGTH;
    constructor(prisma: PrismaService);
    sendOnboardingEmail(dto: SendOnboardingEmailDto): Promise<{
        tokenGenerated: boolean;
        expiresIn: string;
        message: string;
    }>;
    validateSetupToken(token: string): Promise<{
        valid: boolean;
        userEmail?: string;
        expiresAt?: Date;
    }>;
    completeOnboarding(dto: OnboardingSetupDto): Promise<{
        success: boolean;
        userId: string;
        message: string;
    }>;
    getOnboardingStatus(setupToken: string): Promise<{
        setupTokenValid: boolean;
        step: number;
        userEmail: string | undefined;
        expiresAt: Date | undefined;
    }>;
}
