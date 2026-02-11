import { FilesService } from './files.service';
export declare class FilesController {
    private readonly filesService;
    constructor(filesService: FilesService);
    uploadFiles(files: Express.Multer.File[]): Promise<{
        count: number;
        files: {
            id: string;
            status: string;
            originalName: string;
            filename: string;
            path: string;
            size: number;
            mimeType: string;
        }[];
    }>;
    private static getMaxFileSizeBytes;
}
