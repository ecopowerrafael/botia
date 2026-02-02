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
const ia_service_1 = require("./ia.service");
const ia_controller_1 = require("./ia.controller");
const prisma_module_1 = require("../../shared/prisma.module");
const wordpress_module_1 = require("../wordpress/wordpress.module");
let IAModule = class IAModule {
};
exports.IAModule = IAModule;
exports.IAModule = IAModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, wordpress_module_1.WordPressModule],
        controllers: [ia_controller_1.IAController],
        providers: [ia_service_1.IAService],
        exports: [ia_service_1.IAService],
    })
], IAModule);
//# sourceMappingURL=ia.module.js.map