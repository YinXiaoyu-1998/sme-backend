import { BadRequestException, Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      fileFilter: (
        _req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        const allowedTypes = new Set([
          'application/pdf',
          'text/csv',
          'application/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);

        if (!allowedTypes.has(file.mimetype)) {
          return callback(
            new BadRequestException('Only PDF, CSV, or Excel files are allowed'),
            false,
          );
        }

        return callback(null, true);
      },
      limits: {
        fileSize: FilesController.getMaxFileSizeBytes(),
      },
    }),
  )
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    return this.filesService.saveFilesToLocal(files);
  }

  private static getMaxFileSizeBytes(): number {
    const bytes = Number.parseInt(process.env.FILE_MAX_SIZE_BYTES ?? '', 10);
    if (Number.isFinite(bytes) && bytes > 0) {
      return bytes;
    }

    const mb = Number.parseFloat(process.env.FILE_MAX_SIZE_MB ?? '');
    if (Number.isFinite(mb) && mb > 0) {
      return Math.floor(mb * 1024 * 1024);
    }

    return 10 * 1024 * 1024;
  }
}
