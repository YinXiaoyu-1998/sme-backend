import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 获取历史记录
  // GET /chat/history?fileId=...
  @Get('history')
  async getHistory(@Query('fileId') fileId: string) {
    return this.chatService.getHistory(fileId);
  }
  
  @Post()
  async chat(@Body('message') message: string,
  @Body('fileId') fileId: string // <--- 前端需要传 chatId 了
  ) {
    // Receive the message from the frontend in the format { "message": "..." }
    return this.chatService.chat(message, fileId);
  }
}
