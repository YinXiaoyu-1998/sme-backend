import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { DatabrainService } from '../databrain/databrain.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(
    private readonly databrainService: DatabrainService,
    private readonly prismaService: PrismaService,
  ) {}

  async saveFiles(files: Express.Multer.File[]) {
    return this.saveFilesToLocal(files);
  }

  async saveFilesToLocal(files: Express.Multer.File[]) {
    const uploadDir = join(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Write the files to the local filesystem and create a record in the Database
    const savedFiles = await Promise.all(
      files.map(async (file) => {
        const safeName = this.buildSafeFilename(file.originalname);
        const filename = `${Date.now()}-${safeName}`;
        const targetPath = join(uploadDir, filename);

        await writeFile(targetPath, file.buffer);
        const savedFileObject = {
          originalName: file.originalname,
          filename,
          path: targetPath,
          size: file.size,
          mimeType: file.mimetype,
        };
        const record = await this.createDataFileRecord(savedFileObject);
        return { ...savedFileObject, id: record.id, status: record.status };
      }),
    );
    const response = {
      count: savedFiles.length,
      files: savedFiles,
    };

    const primaryFile = savedFiles[0];
    if (primaryFile) {
      try {
        console.log('Loading file to Databrain:', primaryFile.path);
        await this.databrainService.loadFile(primaryFile.path, primaryFile.mimeType);
        await this.updateDataFileStatus(primaryFile.id, 'PROCESSED');
      } catch (error) {
        console.error('Databrain error:', FilesService.getErrorMessage(error));
        await this.updateDataFileStatus(primaryFile.id, 'ERROR');
      }
    }

    return response;
  }

  private buildSafeFilename(originalName: string): string {
    const baseName = basename(originalName);
    return baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private createDataFileRecord(file: {
    originalName: string;
    filename: string;
    path: string;
    mimeType: string;
    size: number;
  }) {
    return this.prismaService.prisma.dataFile.create({
      data: {
        originalName: file.originalName,
        filename: file.filename,
        path: file.path,
        mimeType: file.mimeType,
        size: file.size,
      },
      select: {
        id: true,
        status: true,
      },
    });
  }

  private updateDataFileStatus(id: string, status: 'PROCESSED' | 'ERROR') {
    return this.prismaService.prisma.dataFile.update({
      where: { id },
      data: { status },
    });
  }

  private static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  // Prisma lifecycle handled by PrismaService
}
