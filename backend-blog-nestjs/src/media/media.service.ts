import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma';
import { AuditService } from '../audit/audit.service';
import { MediaType } from '@prisma/client';
import { MediaQueryDto, UpdateMediaDto } from './dto';

interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}

interface ImageVariants {
    [key: string]: string | undefined;
    sm?: string;
    md?: string;
    lg?: string;
    webp?: string;
    thumbnail?: string;
    // PNG variants for social media (Zalo, Messenger compatibility)
    sm_png?: string;
    md_png?: string;
    lg_png?: string;
    og?: string;  // Open Graph optimized (1200x630)
}

@Injectable()
export class MediaService {
    private uploadDir: string;
    private mediaUrl: string;
    private allowedImageTypes: string[];
    private allowedVideoTypes: string[];
    private maxFileSize: number;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
        private auditService: AuditService,
    ) {
        this.uploadDir = this.configService.get<string>('storage.uploadDir') || './uploads';
        this.mediaUrl = this.configService.get<string>('storage.mediaUrl') || 'http://localhost:3001/uploads';
        this.allowedImageTypes = this.configService.get<string[]>('storage.allowedImageTypes') || [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        ];
        this.allowedVideoTypes = this.configService.get<string[]>('storage.allowedVideoTypes') || [
            'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
        ];
        this.maxFileSize = this.configService.get<number>('storage.maxFileSize') || 52428800; // 50MB

        // Ensure upload directories exist
        this.ensureDirectories();
    }

    private async ensureDirectories() {
        const dirs = [
            '', 'images', 'images/original',
            'images/sm', 'images/md', 'images/lg',
            'images/webp', 'images/thumbnail',
            // PNG directories for social media
            'images/lg_png', 'images/og',
            'videos'
        ];
        for (const dir of dirs) {
            const fullPath = path.join(this.uploadDir, dir);
            try {
                await fs.access(fullPath);
            } catch {
                await fs.mkdir(fullPath, { recursive: true });
            }
        }
    }

    async upload(file: UploadedFile, uploaderId?: string, alt?: string, caption?: string) {
        // Validate file
        if (file.size > this.maxFileSize) {
            throw new BadRequestException(`File size exceeds limit of ${this.maxFileSize / 1024 / 1024}MB`);
        }

        // Check magic numbers
        const fileType = await import('file-type');
        const typeInfo = await fileType.fileTypeFromBuffer(file.buffer);

        if (!typeInfo || (!this.allowedImageTypes.includes(typeInfo.mime) && !this.allowedVideoTypes.includes(typeInfo.mime))) {
            throw new BadRequestException(`Invalid file content. detected: ${typeInfo?.mime || 'unknown'}`);
        }

        const isImage = this.allowedImageTypes.includes(typeInfo.mime);
        // const isVideo = this.allowedVideoTypes.includes(typeInfo.mime); // Unused currently

        const id = uuidv4();
        const ext = `.${typeInfo.ext}`; // Trust the detected extension
        const filename = `${id}${ext}`;

        let url: string;
        let thumbnailUrl: string | undefined;
        let width: number | undefined;
        let height: number | undefined;
        let variants: ImageVariants | undefined;
        let type: MediaType;

        if (isImage) {
            type = 'IMAGE';
            const result = await this.processImage(file.buffer, filename);
            url = result.url;
            thumbnailUrl = result.thumbnailUrl;
            width = result.width;
            height = result.height;
            variants = result.variants;
        } else {
            type = 'VIDEO';
            const result = await this.saveVideo(file.buffer, filename);
            url = result.url;
            thumbnailUrl = result.thumbnailUrl;
        }

        const media = await this.prisma.media.create({
            data: {
                filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                type,
                url,
                thumbnailUrl,
                width,
                height,
                alt,
                caption,
                variants: variants || undefined,
                uploaderId,
            },
        });

        await this.auditService.log({
            userId: uploaderId,
            action: 'CREATE',
            entity: 'Media',
            entityId: media.id,
            newValue: { filename: media.filename, type: media.type },
        });

        return media;
    }

    private async processImage(
        buffer: Buffer,
        filename: string,
    ): Promise<{
        url: string;
        thumbnailUrl: string;
        width: number;
        height: number;
        variants: ImageVariants;
    }> {
        const image = sharp(buffer);
        const metadata = await image.metadata();
        const width = metadata.width || 0;
        const height = metadata.height || 0;

        const baseName = path.parse(filename).name;

        // Save original
        const originalPath = path.join(this.uploadDir, 'images/original', filename);
        await fs.writeFile(originalPath, buffer);
        const url = `${this.mediaUrl}/images/original/${filename}`;

        // Generate variants
        const variants: ImageVariants = {};

        // Thumbnail (150px)
        const thumbnailFilename = `${baseName}.webp`;
        const thumbnailPath = path.join(this.uploadDir, 'images/thumbnail', thumbnailFilename);
        await sharp(buffer)
            .resize(150, 150, { fit: 'cover' })
            .webp({ quality: 80 })
            .toFile(thumbnailPath);
        const thumbnailUrl = `${this.mediaUrl}/images/thumbnail/${thumbnailFilename}`;
        variants.thumbnail = thumbnailUrl;

        // Small (320px)
        if (width > 320) {
            const smFilename = `${baseName}.webp`;
            const smPath = path.join(this.uploadDir, 'images/sm', smFilename);
            await sharp(buffer)
                .resize(320, null, { withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(smPath);
            variants.sm = `${this.mediaUrl}/images/sm/${smFilename}`;
        }

        // Medium (768px)
        if (width > 768) {
            const mdFilename = `${baseName}.webp`;
            const mdPath = path.join(this.uploadDir, 'images/md', mdFilename);
            await sharp(buffer)
                .resize(768, null, { withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(mdPath);
            variants.md = `${this.mediaUrl}/images/md/${mdFilename}`;
        }

        // Large (1200px)
        if (width > 1200) {
            const lgFilename = `${baseName}.webp`;
            const lgPath = path.join(this.uploadDir, 'images/lg', lgFilename);
            await sharp(buffer)
                .resize(1200, null, { withoutEnlargement: true })
                .webp({ quality: 85 })
                .toFile(lgPath);
            variants.lg = `${this.mediaUrl}/images/lg/${lgFilename}`;
        }

        // WebP version of original
        const webpFilename = `${baseName}.webp`;
        const webpPath = path.join(this.uploadDir, 'images/webp', webpFilename);
        await sharp(buffer)
            .webp({ quality: 85 })
            .toFile(webpPath);
        variants.webp = `${this.mediaUrl}/images/webp/${webpFilename}`;

        // ===== PNG variants for social media (Zalo, Messenger, FB compatibility) =====

        // Large PNG (1200px width) - fallback for og:image
        if (width > 1200) {
            const lgPngFilename = `${baseName}.png`;
            const lgPngPath = path.join(this.uploadDir, 'images/lg_png', lgPngFilename);
            await sharp(buffer)
                .resize(1200, null, { withoutEnlargement: true })
                .png({ quality: 85, compressionLevel: 6 })
                .toFile(lgPngPath);
            variants.lg_png = `${this.mediaUrl}/images/lg_png/${lgPngFilename}`;
        }

        // Open Graph optimized (1200x630) - exact OG dimensions for social sharing
        const ogFilename = `${baseName}.png`;
        const ogPath = path.join(this.uploadDir, 'images/og', ogFilename);
        await sharp(buffer)
            .resize(1200, 630, { fit: 'cover', position: 'center' })
            .png({ quality: 85, compressionLevel: 6 })
            .toFile(ogPath);
        variants.og = `${this.mediaUrl}/images/og/${ogFilename}`;

        return { url, thumbnailUrl, width, height, variants };
    }

    private async saveVideo(
        buffer: Buffer,
        filename: string,
    ): Promise<{ url: string; thumbnailUrl?: string }> {
        const videoPath = path.join(this.uploadDir, 'videos', filename);
        await fs.writeFile(videoPath, buffer);
        const url = `${this.mediaUrl}/videos/${filename}`;

        // Note: Video thumbnail generation would require ffmpeg
        // For now, return without thumbnail
        return { url, thumbnailUrl: undefined };
    }

    private getExtFromMime(mime: string): string {
        const map: Record<string, string> = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'image/svg+xml': '.svg',
            'video/mp4': '.mp4',
            'video/webm': '.webm',
            'video/quicktime': '.mov',
            'video/x-msvideo': '.avi',
        };
        return map[mime] || '';
    }

    async findAll(query: MediaQueryDto) {
        const { page = 1, limit = 20, type, search } = query;

        const where: any = {};
        if (type) where.type = type;
        if (search) {
            where.OR = [
                { originalName: { contains: search, mode: 'insensitive' } },
                { alt: { contains: search, mode: 'insensitive' } },
                { caption: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [media, total] = await Promise.all([
            this.prisma.media.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.media.count({ where }),
        ]);

        return {
            data: media,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        const media = await this.prisma.media.findUnique({
            where: { id },
        });

        if (!media) {
            throw new NotFoundException('Media not found');
        }

        return media;
    }

    async update(id: string, dto: UpdateMediaDto, userId?: string) {
        const existing = await this.prisma.media.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('Media not found');
        }

        const media = await this.prisma.media.update({
            where: { id },
            data: dto,
        });

        await this.auditService.log({
            userId,
            action: 'UPDATE',
            entity: 'Media',
            entityId: media.id,
        });

        return media;
    }

    async delete(id: string, userId?: string) {
        const media = await this.prisma.media.findUnique({
            where: { id },
        });

        if (!media) {
            throw new NotFoundException('Media not found');
        }

        // Delete files from disk
        try {
            await this.deleteFiles(media);
        } catch (error) {
            console.error('Error deleting media files:', error);
        }

        await this.prisma.media.delete({ where: { id } });

        await this.auditService.log({
            userId,
            action: 'DELETE',
            entity: 'Media',
            entityId: id,
            oldValue: { filename: media.filename, type: media.type },
        });

        return { success: true };
    }

    private async deleteFiles(media: any) {
        const baseName = path.parse(media.filename).name;

        if (media.type === 'IMAGE') {
            const paths = [
                path.join(this.uploadDir, 'images/original', media.filename),
                path.join(this.uploadDir, 'images/thumbnail', `${baseName}.webp`),
                path.join(this.uploadDir, 'images/sm', `${baseName}.webp`),
                path.join(this.uploadDir, 'images/md', `${baseName}.webp`),
                path.join(this.uploadDir, 'images/lg', `${baseName}.webp`),
                path.join(this.uploadDir, 'images/webp', `${baseName}.webp`),
                // PNG variants for social media
                path.join(this.uploadDir, 'images/lg_png', `${baseName}.png`),
                path.join(this.uploadDir, 'images/og', `${baseName}.png`),
            ];

            for (const p of paths) {
                try {
                    await fs.unlink(p);
                } catch {
                    // File may not exist
                }
            }
        } else if (media.type === 'VIDEO') {
            const videoPath = path.join(this.uploadDir, 'videos', media.filename);
            try {
                await fs.unlink(videoPath);
            } catch {
                // File may not exist
            }
        }
    }
}
