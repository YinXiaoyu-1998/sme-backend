import { HttpService } from '@nestjs/axios';
export declare class DatabrainService {
    private readonly httpService;
    private readonly baseUrl;
    constructor(httpService: HttpService);
    loadFile(filepath: string, mimeType: string): Promise<void>;
    aiChat(message: string): Promise<any>;
}
