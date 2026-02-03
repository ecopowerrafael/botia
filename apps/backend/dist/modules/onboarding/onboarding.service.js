"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma.service");
const crypto = __importStar(require("crypto"));
let OnboardingService = class OnboardingService {
    prisma;
    TOKEN_EXPIRY_HOURS = 168;
    TOKEN_LENGTH = 32;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async sendOnboardingEmail(dto) {
        const user = await this.prisma.user.findFirst({
            where: {
                email: dto.email,
                tenantId: dto.tenantId,
            },
        });
        if (!user) {
            throw new common_1.BadRequestException('Usuário não encontrado');
        }
        const setupToken = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {},
        });
        console.log(`
      🔑 Setup Token Gerado (DEV MODE)
      Email: ${user.email}
      Token: ${setupToken}
      Expira em: ${expiresAt.toISOString()}
      Link: /onboarding/${setupToken}
    `);
        return {
            tokenGenerated: true,
            expiresIn: '7 dias',
            message: `Email de onboarding será enviado para ${user.email}`,
        };
    }
    async validateSetupToken(token) {
        return {
            valid: true,
            userEmail: 'user@example.com',
            expiresAt: new Date(),
        };
    }
    async completeOnboarding(dto) {
        const tokenValid = await this.validateSetupToken(dto.setupToken);
        if (!tokenValid.valid) {
            throw new common_1.BadRequestException('Token de setup inválido ou expirado');
        }
        const user = await this.prisma.user.findFirst({
            where: { email: dto.email },
        });
        if (!user) {
            throw new common_1.BadRequestException('Usuário não encontrado');
        }
        await this.prisma.userPreferences.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                operationMode: dto.operationMode,
                audioLanguage: dto.audioLanguage || 'pt-BR',
                timezone: dto.timezone || 'America/Sao_Paulo',
                audioEnabled: true,
                audioSpeed: 1.0,
                language: 'pt-BR',
                notificationsEnabled: true,
            },
            update: {
                operationMode: dto.operationMode,
                audioLanguage: dto.audioLanguage || undefined,
                timezone: dto.timezone || undefined,
            },
        });
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                status: 'ACTIVE',
            },
        });
        return {
            success: true,
            userId: user.id,
            message: 'Onboarding concluído com sucesso!',
        };
    }
    async getOnboardingStatus(setupToken) {
        const validation = await this.validateSetupToken(setupToken);
        return {
            setupTokenValid: validation.valid,
            step: 1,
            userEmail: validation.userEmail,
            expiresAt: validation.expiresAt,
        };
    }
};
exports.OnboardingService = OnboardingService;
exports.OnboardingService = OnboardingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OnboardingService);
//# sourceMappingURL=onboarding.service.js.map