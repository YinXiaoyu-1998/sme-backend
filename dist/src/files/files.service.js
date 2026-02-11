"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FilesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const databrain_service_1 = require("../databrain/databrain.service");
const prisma_service_1 = require("../prisma/prisma.service");
let FilesService = FilesService_1 = class FilesService {
    databrainService;
    prismaService;
    constructor(databrainService, prismaService) {
        this.databrainService = databrainService;
        this.prismaService = prismaService;
    }
    async saveFiles(files) {
        return this.saveFilesToLocal(files);
    }
    async saveFilesToLocal(files) {
        const uploadDir = (0, node_path_1.join)(process.cwd(), 'uploads');
        await (0, promises_1.mkdir)(uploadDir, { recursive: true });
        const savedFiles = await Promise.all(files.map(async (file) => {
            const safeName = this.buildSafeFilename(file.originalname);
            const filename = `${Date.now()}-${safeName}`;
            const targetPath = (0, node_path_1.join)(uploadDir, filename);
            await (0, promises_1.writeFile)(targetPath, file.buffer);
            const savedFileObject = {
                originalName: file.originalname,
                filename,
                path: targetPath,
                size: file.size,
                mimeType: file.mimetype,
            };
            const record = await this.createDataFileRecord(savedFileObject);
            return { ...savedFileObject, id: record.id, status: record.status };
        }));
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
            }
            catch (error) {
                console.error('Databrain error:', FilesService_1.getErrorMessage(error));
                await this.updateDataFileStatus(primaryFile.id, 'ERROR');
            }
        }
        return response;
    }
    buildSafeFilename(originalName) {
        const baseName = (0, node_path_1.basename)(originalName);
        return baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
    }
    createDataFileRecord(file) {
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
    updateDataFileStatus(id, status) {
        return this.prismaService.prisma.dataFile.update({
            where: { id },
            data: { status },
        });
    }
    static getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = FilesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [databrain_service_1.DatabrainService,
        prisma_service_1.PrismaService])
], FilesService);
//# sourceMappingURL=files.service.js.map