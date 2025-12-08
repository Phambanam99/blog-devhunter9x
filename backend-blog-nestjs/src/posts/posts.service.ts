import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../prisma';
import { AuditService } from '../audit/audit.service';
import { CreatePostDto, UpdatePostDto, PostQueryDto, TranslationDto } from './dto';
import { PostStatus } from '@prisma/client';

@Injectable()
export class PostsService {
    constructor(
        private prisma: PrismaService,
        private auditService: AuditService,
    ) { }

    // ============ ADMIN METHODS ============

    async create(dto: CreatePostDto, authorId: string) {
        // Validate unique slugs
        for (const t of dto.translations) {
            const existing = await this.prisma.postTranslation.findUnique({
                where: { locale_slug: { locale: t.locale, slug: t.slug } },
            });
            if (existing) {
                throw new ConflictException(`Slug "${t.slug}" already exists for locale "${t.locale}"`);
            }
        }

        const post = await this.prisma.post.create({
            data: {
                authorId,
                status: dto.status || 'DRAFT',
                publishAt: dto.publishAt ? new Date(dto.publishAt) : null,
                translations: {
                    create: dto.translations.map((t) => ({
                        ...t,
                        bodyHtml: this.renderMarkdown(t.body),
                    })),
                },
                categories: dto.categoryIds
                    ? { create: dto.categoryIds.map((id) => ({ categoryId: id })) }
                    : undefined,
                tags: dto.tagIds
                    ? { create: dto.tagIds.map((id) => ({ tagId: id })) }
                    : undefined,
            },
            include: this.getPostIncludes(),
        });

        await this.auditService.log({
            userId: authorId,
            action: 'CREATE',
            entity: 'Post',
            entityId: post.id,
            newValue: { translations: dto.translations.map((t) => ({ locale: t.locale, title: t.title })) },
        });

        return post;
    }

    async update(id: string, dto: UpdatePostDto, userId: string) {
        const existing = await this.prisma.post.findUnique({
            where: { id },
            include: { translations: true },
        });

        if (!existing) {
            throw new NotFoundException('Post not found');
        }

        // Save revision before update
        for (const t of existing.translations) {
            await this.createRevision(id, t.locale, t, userId);
        }

        // Update translations
        if (dto.translations) {
            for (const t of dto.translations) {
                // Check slug uniqueness (excluding current post)
                const slugExists = await this.prisma.postTranslation.findFirst({
                    where: {
                        locale: t.locale,
                        slug: t.slug,
                        NOT: { postId: id },
                    },
                });
                if (slugExists) {
                    throw new ConflictException(`Slug "${t.slug}" already exists for locale "${t.locale}"`);
                }

                await this.prisma.postTranslation.upsert({
                    where: { postId_locale: { postId: id, locale: t.locale } },
                    create: {
                        postId: id,
                        ...t,
                        bodyHtml: this.renderMarkdown(t.body),
                    },
                    update: {
                        ...t,
                        bodyHtml: this.renderMarkdown(t.body),
                    },
                });
            }
        }

        // Update categories
        if (dto.categoryIds !== undefined) {
            await this.prisma.categoriesOnPosts.deleteMany({ where: { postId: id } });
            if (dto.categoryIds.length > 0) {
                await this.prisma.categoriesOnPosts.createMany({
                    data: dto.categoryIds.map((categoryId) => ({ postId: id, categoryId })),
                });
            }
        }

        // Update tags
        if (dto.tagIds !== undefined) {
            await this.prisma.tagsOnPosts.deleteMany({ where: { postId: id } });
            if (dto.tagIds.length > 0) {
                await this.prisma.tagsOnPosts.createMany({
                    data: dto.tagIds.map((tagId) => ({ postId: id, tagId })),
                });
            }
        }

        // Update post
        const post = await this.prisma.post.update({
            where: { id },
            data: {
                status: dto.status,
                publishAt: dto.publishAt ? new Date(dto.publishAt) : undefined,
            },
            include: this.getPostIncludes(),
        });

        await this.auditService.log({
            userId,
            action: 'UPDATE',
            entity: 'Post',
            entityId: post.id,
        });

        return post;
    }

    async delete(id: string, userId: string) {
        const post = await this.prisma.post.findUnique({
            where: { id },
            include: { translations: true },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        await this.prisma.post.delete({ where: { id } });

        await this.auditService.log({
            userId,
            action: 'DELETE',
            entity: 'Post',
            entityId: id,
            oldValue: { translations: post.translations.map((t) => ({ locale: t.locale, title: t.title })) },
        });

        return { success: true };
    }

    async publish(id: string, userId: string, publishAt?: string) {
        const post = await this.prisma.post.findUnique({
            where: { id },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        const now = new Date();
        const scheduledDate = publishAt ? new Date(publishAt) : null;

        const updated = await this.prisma.post.update({
            where: { id },
            data: {
                status: scheduledDate && scheduledDate > now ? 'SCHEDULED' : 'PUBLISHED',
                publishAt: scheduledDate || now,
            },
            include: this.getPostIncludes(),
        });

        await this.auditService.log({
            userId,
            action: scheduledDate && scheduledDate > now ? 'SCHEDULE' : 'PUBLISH',
            entity: 'Post',
            entityId: id,
        });

        // TODO: Trigger webhook for cache invalidation
        // await this.webhooksService.trigger('post.published', updated);

        return updated;
    }

    async unpublish(id: string, userId: string) {
        const post = await this.prisma.post.findUnique({
            where: { id },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        const updated = await this.prisma.post.update({
            where: { id },
            data: {
                status: 'DRAFT',
                publishAt: null,
            },
            include: this.getPostIncludes(),
        });

        await this.auditService.log({
            userId,
            action: 'UNPUBLISH',
            entity: 'Post',
            entityId: id,
        });

        return updated;
    }

    async findAllAdmin(query: PostQueryDto) {
        const { page = 1, limit = 20, status, search, categoryId, tagId, authorId } = query;

        const where: any = {};
        if (status) where.status = status;
        if (authorId) where.authorId = authorId;
        if (categoryId) {
            where.categories = { some: { categoryId } };
        }
        if (tagId) {
            where.tags = { some: { tagId } };
        }
        if (search) {
            where.translations = {
                some: {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { body: { contains: search, mode: 'insensitive' } },
                    ],
                },
            };
        }

        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where,
                include: this.getPostIncludes(),
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.post.count({ where }),
        ]);

        return {
            data: posts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOneAdmin(id: string) {
        const post = await this.prisma.post.findUnique({
            where: { id },
            include: this.getPostIncludes(),
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        return post;
    }

    // ============ REVISIONS ============

    async getRevisions(postId: string, locale: string) {
        return this.prisma.revision.findMany({
            where: { postId, locale },
            include: {
                createdBy: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { version: 'desc' },
        });
    }

    async rollback(postId: string, locale: string, version: number, userId: string) {
        const revision = await this.prisma.revision.findUnique({
            where: { postId_locale_version: { postId, locale, version } },
        });

        if (!revision) {
            throw new NotFoundException('Revision not found');
        }

        const data = revision.data as unknown as TranslationDto;

        // Get current translation to save as new revision
        const current = await this.prisma.postTranslation.findUnique({
            where: { postId_locale: { postId, locale } },
        });

        if (current) {
            await this.createRevision(postId, locale, current, userId);
        }

        // Apply rollback
        await this.prisma.postTranslation.update({
            where: { postId_locale: { postId, locale } },
            data: {
                title: data.title,
                slug: data.slug,
                excerpt: data.excerpt,
                body: data.body,
                bodyHtml: this.renderMarkdown(data.body),
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription,
                canonical: data.canonical,
                ogImage: data.ogImage,
                schemaType: data.schemaType,
                schemaData: data.schemaData,
            },
        });

        await this.auditService.log({
            userId,
            action: 'UPDATE',
            entity: 'Post',
            entityId: postId,
            newValue: { rollbackTo: version, locale },
        });

        return this.findOneAdmin(postId);
    }

    private async createRevision(postId: string, locale: string, data: any, userId: string) {
        const lastRevision = await this.prisma.revision.findFirst({
            where: { postId, locale },
            orderBy: { version: 'desc' },
        });

        const version = (lastRevision?.version || 0) + 1;

        await this.prisma.revision.create({
            data: {
                postId,
                locale,
                version,
                data: JSON.parse(JSON.stringify(data)),
                createdById: userId,
            },
        });
    }

    // ============ PREVIEW TOKEN ============

    async generatePreviewToken(postId: string): Promise<{ token: string; url: string }> {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post) {
            throw new NotFoundException('Post not found');
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await this.prisma.previewToken.create({
            data: {
                token,
                postId,
                expiresAt,
            },
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        return {
            token,
            url: `${frontendUrl}/preview/${token}`,
        };
    }

    async getByPreviewToken(token: string) {
        const previewToken = await this.prisma.previewToken.findUnique({
            where: { token },
        });

        if (!previewToken || previewToken.expiresAt < new Date()) {
            throw new BadRequestException('Invalid or expired preview token');
        }

        return this.prisma.post.findUnique({
            where: { id: previewToken.postId },
            include: this.getPostIncludes(),
        });
    }

    // ============ PUBLIC METHODS ============

    async findPublished(query: PostQueryDto) {
        const { page = 1, limit = 10, locale, categoryId, tagId, search } = query;

        const where: any = {
            status: 'PUBLISHED',
            OR: [
                { publishAt: null },
                { publishAt: { lte: new Date() } },
            ],
        };

        if (categoryId) {
            where.categories = { some: { categoryId } };
        }
        if (tagId) {
            where.tags = { some: { tagId } };
        }
        if (search && locale) {
            where.translations = {
                some: {
                    locale,
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { body: { contains: search, mode: 'insensitive' } },
                    ],
                },
            };
        }

        const includeFiltered = {
            ...this.getPostIncludes(),
            translations: locale
                ? {
                    where: { locale },
                    include: { heroImage: true },
                }
                : {
                    include: { heroImage: true },
                },
        };

        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where,
                include: includeFiltered,
                orderBy: { publishAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.post.count({ where }),
        ]);

        return {
            data: posts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findBySlug(slug: string, locale: string) {
        const translation = await this.prisma.postTranslation.findUnique({
            where: { locale_slug: { locale, slug } },
            include: {
                post: {
                    include: this.getPostIncludes(),
                },
                heroImage: true,
            },
        });

        if (!translation) {
            throw new NotFoundException('Post not found');
        }

        if (translation.post.status !== 'PUBLISHED') {
            throw new NotFoundException('Post not found');
        }

        return {
            ...translation.post,
            currentTranslation: translation,
        };
    }

    // ============ HELPERS ============

    private getPostIncludes() {
        return {
            translations: {
                include: {
                    heroImage: true,
                },
            },
            author: {
                select: { id: true, name: true, avatar: true },
            },
            categories: {
                include: {
                    category: {
                        include: {
                            translations: true,
                        },
                    },
                },
            },
            tags: {
                include: {
                    tag: {
                        include: {
                            translations: true,
                        },
                    },
                },
            },
        };
    }

    private renderMarkdown(markdown: string): string {
        const html = marked(markdown) as string;

        // Sanitize HTML to prevent XSS
        return sanitizeHtml(html, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat([
                'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'code', 'figure', 'figcaption',
            ]),
            allowedAttributes: {
                ...sanitizeHtml.defaults.allowedAttributes,
                img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
                code: ['class'],
                pre: ['class'],
                a: ['href', 'target', 'rel'],
            },
            allowedClasses: {
                code: ['language-*', 'hljs', '*'],
                pre: ['language-*', 'hljs', '*'],
            },
        });
    }
}
