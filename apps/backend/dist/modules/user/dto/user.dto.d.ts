import { UserRole, VendorMode } from '../../../shared/enums';
export declare class UserCreateDto {
    email: string;
    name: string;
    phone?: string;
    role: UserRole;
    password: string;
    tenantId: string;
}
export declare class UserPreferencesDto {
    operationMode: VendorMode;
    audioEnabled?: boolean;
    audioLanguage?: string;
    audioSpeed?: number;
    language?: string;
    timezone?: string;
    notificationsEnabled?: boolean;
}
export declare class UserResponseDto {
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
