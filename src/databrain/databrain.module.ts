import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatabrainService } from './databrain.service';

@Module({
  imports: [HttpModule],
  providers: [DatabrainService],
  exports: [DatabrainService],
})
export class DatabrainModule {}
