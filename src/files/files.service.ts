import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { DatabrainService } from '@databrain/databrain.service';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(
    private readonly databrainService: DatabrainService,
    private readonly prismaService: PrismaService,
  ) {}

  async saveFiles(files: Express.Multer.File[], userId: string) {
    return this.saveFilesToLocal(files, userId);
  }

  async saveFilesToLocal(files: Express.Multer.File[], userId: string) {
    const uploadDir = join(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Write the files to the local filesystem and create a record in the Database
    const savedFiles = await Promise.all(
      files.map(async (file) => {
        console.log('Saving file to local:', file.filename);
        const originalName = this.decodeOriginalName(file.originalname);
        console.log('Original name:', originalName);
        console.log('User ID:', userId);
        const safeName = this.buildSafeFilename(originalName);
        const filename = `${Date.now()}-${safeName}`;
        const targetPath = join(uploadDir, filename);

        await writeFile(targetPath, file.buffer);
        const savedFileObject = {
          userId,
          originalName,
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
        await this.databrainService.loadFile(
          primaryFile.id,
          primaryFile.path,
          primaryFile.mimeType,
        );
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

  private decodeOriginalName(originalName: string): string {
    // Multer may treat non-ASCII filenames as latin1; normalize to UTF-8.
    const normalized = Buffer.from(originalName, 'latin1').toString('utf8');
    return normalized || originalName;
  }

  private createDataFileRecord(file: {
    userId: string;
    originalName: string;
    filename: string;
    path: string;
    mimeType: string;
    size: number;
  }) {
    return this.prismaService.prisma.dataFile.create({
      data: {
        userId: file.userId,
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

  async listFilesByUserId(userId: string) {
    const files = await this.prismaService.prisma.dataFile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        originalName: true,
        filename: true,
        path: true,
        size: true,
        mimeType: true,
        status: true,
      },
    });

    return {
      count: files.length,
      files,
    };
  }

  private static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  // Prisma lifecycle handled by PrismaService
}
