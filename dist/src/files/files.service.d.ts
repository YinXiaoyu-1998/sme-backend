import { DatabrainService } from '../databrain/databrain.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class FilesService {
    private readonly databrainService;
    private readonly prismaService;
    constructor(databrainService: DatabrainService, prismaService: PrismaService);
    saveFiles(files: Express.Multer.File[]): Promise<{
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
    saveFilesToLocal(files: Express.Multer.File[]): Promise<{
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
    private buildSafeFilename;
    private createDataFileRecord;
    private updateDataFileStatus;
    private static getErrorMessage;
}
