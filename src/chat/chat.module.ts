import { Module } from '@nestjs/common';
import { ChatController } from '@chat/chat.controller';
import { ChatService } from '@chat/chat.service';
import { DatabrainModule } from '@databrain/databrain.module';
import { PrismaModule } from '@prisma/prisma.module';

@Module({
  imports: [DatabrainModule, PrismaModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
