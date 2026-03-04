import { Module } from '@nestjs/common';
import { AppController } from '@app/app.controller';
import { AppService } from '@app/app.service';
import { FilesModule } from '@files/files.module';
import { ChatModule } from '@chat/chat.module';
import { UserModule } from '@user/user.module';
import { RedisModule } from '@redis/redis.module';

@Module({
  imports: [FilesModule, ChatModule, UserModule, RedisModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
