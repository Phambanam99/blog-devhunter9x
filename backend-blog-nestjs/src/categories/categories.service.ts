import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { AuditService } from '../audit/audit.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
    constructor(
        private prisma: PrismaService,
        private auditService: AuditService,
    ) { }

    async create(dto: CreateCategoryDto, userId?: string) {
        // Check unique slugs
        for (const t of dto.translations) {
            const existing = await this.prisma.categoryTranslation.findUnique({
                where: { locale_slug: { locale: t.locale, slug: t.slug } },
            });
            if (existing) {
                throw new ConflictException(`Slug "${t.slug}" already exists for locale "${t.locale}"`);
            }
        }

        const category = await this.prisma.category.create({
            data: {
                parentId: dto.parentId,
                translations: {
                    create: dto.translations,
                },
            },
            include: { translations: true, children: true },
        });

        await this.auditService.log({
            userId,
            action: 'CREATE',
            entity: 'Category',
            entityId: category.id,
            newValue: { translations: dto.translations },
        });

        return category;
    }

    async findAll(locale?: string) {
        const categories = await this.prisma.category.findMany({
            include: {
                translations: locale ? { where: { locale } } : true,
                children: {
                    include: {
                        translations: locale ? { where: { locale } } : true,
                    },
                },
                _count: {
                    select: { posts: true },
                },
            },
            where: { parentId: null }, // Top-level only
            orderBy: { createdAt: 'asc' },
        });

        return categories;
    }

    async findOne(id: string) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                translations: true,
                children: {
                    include: { translations: true },
                },
                parent: {
                    include: { translations: true },
                },
                _count: {
                    select: { posts: true },
                },
            },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    async findBySlug(slug: string, locale: string) {
        const translation = await this.prisma.categoryTranslation.findUnique({
            where: { locale_slug: { locale, slug } },
            include: {
                category: {
                    include: {
                        translations: true,
                        _count: { select: { posts: true } },
                    },
                },
            },
        });

        if (!translation) {
            throw new NotFoundException('Category not found');
        }

        return translation.category;
    }

    async update(id: string, dto: UpdateCategoryDto, userId?: string) {
        const existing = await this.prisma.category.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('Category not found');
        }

        // Update translations
        if (dto.translations) {
            for (const t of dto.translations) {
                // Check slug uniqueness
                const slugExists = await this.prisma.categoryTranslation.findFirst({
                    where: {
                        locale: t.locale,
                        slug: t.slug,
                        NOT: { categoryId: id },
                    },
                });
                if (slugExists) {
                    throw new ConflictException(`Slug "${t.slug}" already exists for locale "${t.locale}"`);
                }

                await this.prisma.categoryTranslation.upsert({
                    where: { categoryId_locale: { categoryId: id, locale: t.locale } },
                    create: { categoryId: id, ...t },
                    update: t,
                });
            }
        }

        const category = await this.prisma.category.update({
            where: { id },
            data: {
                parentId: dto.parentId,
            },
            include: { translations: true, children: true },
        });

        await this.auditService.log({
            userId,
            action: 'UPDATE',
            entity: 'Category',
            entityId: category.id,
        });

        return category;
    }

    async delete(id: string, userId?: string) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: { children: true, posts: true },
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        if (category.children.length > 0) {
            throw new ConflictException('Cannot delete category with children');
        }

        if (category.posts.length > 0) {
            throw new ConflictException('Cannot delete category with posts');
        }

        await this.prisma.category.delete({ where: { id } });

        await this.auditService.log({
            userId,
            action: 'DELETE',
            entity: 'Category',
            entityId: id,
        });

        return { success: true };
    }
}
