import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabrainService } from '@databrain/databrain.service';
import { PrismaService } from '@prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
import { GeneratedFileResponse } from './dto/chat.responses';
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
  async getHistory(userId: string) {
    if (!userId?.trim()) {
      throw new BadRequestException('userId is required');
    }
    const messages = await this.prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }, // 按时间正序
    });

    const messageIds = messages.map((message) => message.id);
    if (messageIds.length === 0) {
      return messages.map((message) => ({ ...message, generatedFiles: [] }));
    }

    const generatedFiles = await this.prisma.generatedFile.findMany({
      where: { messageId: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        messageId: true,
        fileType: true,
        mimeType: true,
        filename: true,
        path: true,
        url: true,
        size: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const baseUrl = this.getPublicBaseUrl();
    const filesByMessageId = new Map<string, Array<(typeof generatedFiles)[number] & { url: string }>>();
    for (const file of generatedFiles) {
      if (!file.messageId) {
        continue;
      }
      const withUrl = {
        ...file,
        url: this.normalizeGeneratedFileUrl({
          baseUrl,
          url: file.url || '',
          filename: file.filename,
        }),
      };
      const bucket = filesByMessageId.get(file.messageId);
      if (bucket) {
        bucket.push(withUrl);
      } else {
        filesByMessageId.set(file.messageId, [withUrl]);
      }
    }

    return messages.map((message) => ({
      ...message,
      generatedFiles: filesByMessageId.get(message.id) ?? [],
    }));
  }

  async chat({message, fileId, userId}: {message: string, fileId: string | undefined, userId: string}) {
    if (!userId?.trim()) {
      throw new BadRequestException('userId is required');
    }
    // // A. 先保存【用户】的消息
    await this.prisma.message.create({
        data: {
          content: message,
          role: 'user',
          userId,
          fileId,
        },
      });
    // B. Call
    const response = await this.databrainService.aiChat({
      userId,
      fileId,
      message,
      history: [],
    });
    console.log("Test2026 response:", response);
    const aiAnswer = response.answer;
    // C. 保存【AI】的消息
    const newMessage = await this.prisma.message.create({
        data: {
          content: aiAnswer,
          role: 'ai',
          userId,
          fileId,
        },
      });
    const baseUrl = this.getPublicBaseUrl();
    const generatedFiles: Array<{
      id: string;
      fileType: string;
      mimeType: string;
      filename: string;
      path: string;
      size: number;
      url: string;
    }> = (response.generatedFiles || []).map((file: {
      id: string;
      fileType: string;
      mimeType: string;
      filename: string;
      path: string;
      size: number;
    }) => ({
      ...file,
      url: this.buildGeneratedFileUrl({ baseUrl, filename: file.filename }),
    }));

    // After the AI response is saved we then have the messageId, update it into the generatedFiles table rows.
    if (generatedFiles.length > 0) {
      await this.prisma.$transaction(
        generatedFiles.map((file) =>
          this.prisma.generatedFile.update({
            where: { id: file.id },
            data: { messageId: newMessage.id, url: file.url },
          }),
        ),
      );
    }

    return { answer: aiAnswer, generatedFiles };
  }

  private getPublicBaseUrl() {
    return process.env.PUBLIC_BASE_URL ?? 'http://localhost:4000';
  }

  private buildGeneratedFileUrl(params: { baseUrl: string; filename: string }) {
    const { baseUrl, filename } = params;
    return new URL(`/generated/${encodeURIComponent(filename)}`, baseUrl).toString();
  }

  private normalizeGeneratedFileUrl(params: { baseUrl: string; url: string; filename: string }) {
    const { baseUrl, url, filename } = params;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/')) {
      return new URL(url, baseUrl).toString();
    }
    return this.buildGeneratedFileUrl({ baseUrl, filename });
  }
}
