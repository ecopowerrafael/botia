import { OnboardingService } from './onboarding.service';
import { OnboardingSetupDto, SendOnboardingEmailDto } from './dto/onboarding.dto';
export declare class OnboardingController {
    private onboardingService;
    constructor(onboardingService: OnboardingService);
    sendOnboardingEmail(dto: SendOnboardingEmailDto): Promise<{
        tokenGenerated: boolean;
        expiresIn: string;
        message: string;
    }>;
    getStatus(token: string): Promise<{
        setupTokenValid: boolean;
        step: number;
        userEmail: string | undefined;
        expiresAt: Date | undefined;
    }>;
    completeOnboarding(dto: OnboardingSetupDto): Promise<{
        success: boolean;
        userId: string;
        message: string;
    }>;
    validateToken(token: string): Promise<{
        valid: boolean;
        userEmail?: string;
        expiresAt?: Date;
    }>;
}
