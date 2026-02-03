"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BullQueueModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const config_1 = require("@nestjs/config");
let BullQueueModule = class BullQueueModule {
};
exports.BullQueueModule = BullQueueModule;
exports.BullQueueModule = BullQueueModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const redisHost = configService.get('REDIS_HOST', 'localhost');
                    const redisPort = configService.get('REDIS_PORT', 6379);
                    const redisPassword = configService.get('REDIS_PASSWORD');
                    const redisDb = configService.get('REDIS_DB', 0);
                    return {
                        connection: {
                            host: redisHost,
                            port: parseInt(String(redisPort), 10),
                            password: redisPassword || undefined,
                            db: parseInt(String(redisDb), 10),
                        },
                    };
                },
            }),
            bullmq_1.BullModule.registerQueue({
                name: 'audio',
            }),
            bullmq_1.BullModule.registerQueue({
                name: 'notification',
            }),
            bullmq_1.BullModule.registerQueue({
                name: 'cleanup',
            }),
            bullmq_1.BullModule.registerQueue({
                name: 'sync',
            }),
        ],
        exports: [bullmq_1.BullModule],
    })
], BullQueueModule);
//# sourceMappingURL=bull.module.js.map