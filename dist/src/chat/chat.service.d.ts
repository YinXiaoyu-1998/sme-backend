import { DatabrainService } from 'src/databrain/databrain.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class ChatService {
    private readonly databrainService;
    private readonly prismaService;
    private readonly prisma;
    constructor(databrainService: DatabrainService, prismaService: PrismaService);
    getHistory(chatId: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        role: string;
        chatId: string | null;
        fileId: string | null;
    }[]>;
    chat(message: string, fileId?: string): Promise<{
        answer: any;
    }>;
}
