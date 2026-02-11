import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FilesModule } from './files/files.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [FilesModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
