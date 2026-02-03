import { VendorMode } from '../../../shared/enums';
export declare class OnboardingSetupDto {
    setupToken: string;
    email: string;
    password: string;
    operationMode: VendorMode;
    timezone?: string;
    audioLanguage?: string;
}
export declare class OnboardingStatusDto {
    setupTokenValid: boolean;
    step: number;
    userEmail: string;
    expiresAt: Date;
}
export declare class SendOnboardingEmailDto {
    email: string;
    tenantId: string;
}
