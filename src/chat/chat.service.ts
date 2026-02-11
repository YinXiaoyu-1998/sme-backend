import { Injectable } from '@nestjs/common';
import { DatabrainService } from 'src/databrain/databrain.service';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
@Injectable()
export class ChatService {
    private readonly prisma: PrismaClient;
  constructor(
    private readonly databrainService: DatabrainService,
    private readonly prismaService: PrismaService,
  ) {
    this.prisma = prismaService.prisma;
  }

  // 1. 获取某文件的历史记录
  async getHistory(chatId: string) {
    return this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' }, // 按时间正序
    });
  }

  async chat(message: string, fileId?: string) {
    // // A. 先保存【用户】的消息
    await this.prisma.message.create({
        data: {
          content: message,
          role: 'user',
          fileId, // 关联到当前聊天
        },
      });
    // B. Call
    const response = await this.databrainService.aiChat(message);
    console.log("Test2026 response:", response);
    const aiAnswer = response.answer;
    // C. 保存【AI】的消息
    await this.prisma.message.create({
        data: {
          content: aiAnswer,
          role: 'ai',
          fileId,
        },
      });
    return { answer: aiAnswer };
  }
}
