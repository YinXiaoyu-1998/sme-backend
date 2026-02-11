import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { DatabrainModule } from '../databrain/databrain.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [DatabrainModule, PrismaModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
