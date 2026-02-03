"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IAModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const ia_service_1 = require("./ia.service");
const ia_controller_1 = require("./ia.controller");
const ia_integration_service_1 = require("./ia-integration.service");
const ia_integration_controller_1 = require("./ia-integration.controller");
const prisma_module_1 = require("../../shared/prisma.module");
const wordpress_module_1 = require("../wordpress/wordpress.module");
const conversation_module_1 = require("../conversation/conversation.module");
const intent_module_1 = require("../intent/intent.module");
const cart_module_1 = require("../cart/cart.module");
const tts_module_1 = require("../tts/tts.module");
let IAModule = class IAModule {
};
exports.IAModule = IAModule;
exports.IAModule = IAModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            wordpress_module_1.WordPressModule,
            axios_1.HttpModule,
            conversation_module_1.ConversationModule,
            intent_module_1.IntentModule,
            cart_module_1.CartModule,
            tts_module_1.TTSModule,
        ],
        controllers: [ia_controller_1.IAController, ia_integration_controller_1.IAIntegrationController],
        providers: [ia_service_1.IAService, ia_integration_service_1.IAIntegrationService],
        exports: [ia_service_1.IAService, ia_integration_service_1.IAIntegrationService],
    })
], IAModule);
//# sourceMappingURL=ia.module.js.map