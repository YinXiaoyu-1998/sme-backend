import { OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService implements OnModuleDestroy {
    private readonly pool;
    private readonly client;
    constructor();
    get prisma(): PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/client").DefaultArgs>;
    onModuleDestroy(): Promise<void>;
}
