import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ChatService } from '@chat/chat.service';
import type { ChatAnswerResponse, ChatMessageResponse } from '@chat/dto/chat.responses';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 获取历史记录
  // GET /chat/history?fileId=...
  @Get('history')
  async getHistory(@Query('userId') userId: string): Promise<ChatMessageResponse[]> {
    return this.chatService.getHistory(userId);
  }
  
  @Post()
  async chat(
    @Body('message') message: string,
    @Body('fileId') fileId: string | undefined, // optional: scope chat to a file
    @Body('userId') userId: string,
  ): Promise<ChatAnswerResponse> {
    // Receive the message from the frontend in the format { "message": "..." }
    return this.chatService.chat({message, fileId, userId});
  }
}
