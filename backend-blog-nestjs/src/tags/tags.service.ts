import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { AuditService } from '../audit/audit.service';
import { CreateTagDto, UpdateTagDto } from './dto';

@Injectable()
export class TagsService {
    constructor(
        private prisma: PrismaService,
        private auditService: AuditService,
    ) { }

    async create(dto: CreateTagDto, userId?: string) {
        for (const t of dto.translations) {
            const existing = await this.prisma.tagTranslation.findUnique({
                where: { locale_slug: { locale: t.locale, slug: t.slug } },
            });
            if (existing) {
                throw new ConflictException(`Slug "${t.slug}" already exists for locale "${t.locale}"`);
            }
        }

        const tag = await this.prisma.tag.create({
            data: {
                translations: {
                    create: dto.translations,
                },
            },
            include: { translations: true },
        });

        await this.auditService.log({
            userId,
            action: 'CREATE',
            entity: 'Tag',
            entityId: tag.id,
            newValue: { translations: dto.translations },
        });

        return tag;
    }

    async findAll(locale?: string) {
        return this.prisma.tag.findMany({
            include: {
                translations: locale ? { where: { locale } } : true,
                _count: { select: { posts: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const tag = await this.prisma.tag.findUnique({
            where: { id },
            include: {
                translations: true,
                _count: { select: { posts: true } },
            },
        });

        if (!tag) {
            throw new NotFoundException('Tag not found');
        }

        return tag;
    }

    async findBySlug(slug: string, locale: string) {
        const translation = await this.prisma.tagTranslation.findUnique({
            where: { locale_slug: { locale, slug } },
            include: {
                tag: {
                    include: {
                        translations: true,
                        _count: { select: { posts: true } },
                    },
                },
            },
        });

        if (!translation) {
            throw new NotFoundException('Tag not found');
        }

        return translation.tag;
    }

    async update(id: string, dto: UpdateTagDto, userId?: string) {
        const existing = await this.prisma.tag.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('Tag not found');
        }

        for (const t of dto.translations) {
            const slugExists = await this.prisma.tagTranslation.findFirst({
                where: {
                    locale: t.locale,
                    slug: t.slug,
                    NOT: { tagId: id },
                },
            });
            if (slugExists) {
                throw new ConflictException(`Slug "${t.slug}" already exists for locale "${t.locale}"`);
            }

            await this.prisma.tagTranslation.upsert({
                where: { tagId_locale: { tagId: id, locale: t.locale } },
                create: { tagId: id, ...t },
                update: t,
            });
        }

        const tag = await this.prisma.tag.findUnique({
            where: { id },
            include: { translations: true },
        });

        await this.auditService.log({
            userId,
            action: 'UPDATE',
            entity: 'Tag',
            entityId: id,
        });

        return tag;
    }

    async delete(id: string, userId?: string) {
        const tag = await this.prisma.tag.findUnique({
            where: { id },
            include: { posts: true },
        });

        if (!tag) {
            throw new NotFoundException('Tag not found');
        }

        if (tag.posts.length > 0) {
            throw new ConflictException('Cannot delete tag with posts');
        }

        await this.prisma.tag.delete({ where: { id } });

        await this.auditService.log({
            userId,
            action: 'DELETE',
            entity: 'Tag',
            entityId: id,
        });

        return { success: true };
    }
}
