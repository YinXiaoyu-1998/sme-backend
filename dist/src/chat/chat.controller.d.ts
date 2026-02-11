import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getHistory(fileId: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        role: string;
        chatId: string | null;
        fileId: string | null;
    }[]>;
    chat(message: string, fileId: string): Promise<{
        answer: any;
    }>;
}
