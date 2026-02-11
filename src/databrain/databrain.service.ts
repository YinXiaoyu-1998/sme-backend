import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DatabrainService {
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    const envUrl = process.env.SME_DATABRAIN_URL;
    if (!envUrl) {
      throw new Error('SME_DATABRAIN_URL is required to use DatabrainService');
    }
    this.baseUrl = envUrl;
  }

  async loadFile(filepath: string, mimeType: string) {
    const url = new URL('/context/load', this.baseUrl).toString();
    await firstValueFrom(
      this.httpService.post(url, {
        filepath,
        mimeType,
      }),
    );
  }

  async aiChat(message: string) {
    const url = new URL('/chat', this.baseUrl).toString();
    const response = await firstValueFrom(
      this.httpService.post(url, {
        message,
      }),
    );
    return response.data;
  }
}
