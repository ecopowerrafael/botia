import { PrismaService } from '../../shared/prisma.service';
export declare class TenantService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<any>;
}
