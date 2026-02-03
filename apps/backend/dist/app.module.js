"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./shared/prisma.module");
const bull_module_1 = require("./shared/bull.module");
const queue_scheduler_service_1 = require("./shared/queue-scheduler.service");
const tenant_module_1 = require("./modules/tenant/tenant.module");
const ia_module_1 = require("./modules/ia/ia.module");
const whatsapp_module_1 = require("./modules/whatsapp/whatsapp.module");
const knowledge_module_1 = require("./modules/knowledge/knowledge.module");
const automation_module_1 = require("./modules/automation/automation.module");
const wordpress_module_1 = require("./modules/wordpress/wordpress.module");
const user_module_1 = require("./modules/user/user.module");
const onboarding_module_1 = require("./modules/onboarding/onboarding.module");
const cart_module_1 = require("./modules/cart/cart.module");
const payment_module_1 = require("./modules/payment/payment.module");
const audio_module_1 = require("./modules/audio/audio.module");
const intent_module_1 = require("./modules/intent/intent.module");
const tts_module_1 = require("./modules/tts/tts.module");
const conversation_module_1 = require("./modules/conversation/conversation.module");
const notification_module_1 = require("./modules/notification/notification.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            bull_module_1.BullQueueModule,
            tenant_module_1.TenantModule,
            ia_module_1.IAModule,
            whatsapp_module_1.WhatsAppModule,
            knowledge_module_1.KnowledgeModule,
            automation_module_1.AutomationModule,
            wordpress_module_1.WordPressModule,
            user_module_1.UserModule,
            onboarding_module_1.OnboardingModule,
            cart_module_1.CartModule,
            payment_module_1.PaymentModule,
            audio_module_1.AudioModule,
            intent_module_1.IntentModule,
            tts_module_1.TTSModule,
            conversation_module_1.ConversationModule,
            notification_module_1.NotificationModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            queue_scheduler_service_1.QueueSchedulerService,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map