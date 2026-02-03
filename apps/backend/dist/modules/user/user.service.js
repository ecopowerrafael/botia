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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma.service");
const enums_1 = require("../../shared/enums");
const bcrypt = __importStar(require("bcrypt"));
let UserService = class UserService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createUser(dto) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                email: dto.email,
                tenantId: dto.tenantId,
            },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Usuário já existe com este email');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                phone: dto.phone,
                role: dto.role,
                password: hashedPassword,
                status: enums_1.UserStatus.PENDING_ONBOARDING,
                tenantId: dto.tenantId,
            },
            include: {
                preferences: true,
            },
        });
        return this.mapToResponseDto(user);
    }
    async findByEmail(email, tenantId) {
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
    async findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
            include: {
                preferences: true,
            },
        });
    }
    async updatePreferences(userId, dto) {
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
                    notificationsEnabled: dto.notificationsEnabled ?? existingPreferences.notificationsEnabled,
                },
            });
        }
        else {
            return this.prisma.userPreferences.create({
                data: {
                    userId,
                    operationMode: dto.operationMode || enums_1.VendorMode.SELLER,
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
    async activateUser(userId) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                status: enums_1.UserStatus.ACTIVE,
            },
            include: {
                preferences: true,
            },
        });
        return this.mapToResponseDto(user);
    }
    async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
    mapToResponseDto(user) {
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
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map