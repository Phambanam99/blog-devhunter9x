// prisma/seed.ts
import 'dotenv/config';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
    connectionString:
        process.env.DATABASE_URL ||
        'postgresql://blog_user:blog_secret_123@localhost:5432/blog_db?schema=public',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding database...');

    // === Users ===
    const [adminPassword, editorPassword, authorPassword] = await Promise.all([
        bcrypt.hash('admin123', 12),
        bcrypt.hash('editor123', 12),
        bcrypt.hash('author123', 12),
    ]);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {
            name: 'Admin User',
            passwordHash: adminPassword,
            role: 'ADMIN',
            isActive: true,
        },
        create: {
            id: 'user-admin',
            email: 'admin@example.com',
            passwordHash: adminPassword,
            name: 'Admin User',
            role: 'ADMIN',
            isActive: true,
        },
    });

    const editor = await prisma.user.upsert({
        where: { email: 'editor@example.com' },
        update: {
            name: 'Editor User',
            passwordHash: editorPassword,
            role: 'EDITOR',
            isActive: true,
        },
        create: {
            id: 'user-editor',
            email: 'editor@example.com',
            passwordHash: editorPassword,
            name: 'Editor User',
            role: 'EDITOR',
            isActive: true,
        },
    });

    const author = await prisma.user.upsert({
        where: { email: 'author@example.com' },
        update: {
            name: 'Author User',
            passwordHash: authorPassword,
            role: 'AUTHOR',
            isActive: true,
        },
        create: {
            id: 'user-author',
            email: 'author@example.com',
            passwordHash: authorPassword,
            name: 'Author User',
            role: 'AUTHOR',
            isActive: true,
        },
    });
    console.log('Users seeded');

    // === Refresh Tokens ===
    const refreshExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await prisma.refreshToken.upsert({
        where: { token: 'admin-refresh-token' },
        update: { userId: admin.id, expiresAt: refreshExpiry },
        create: {
            id: 'rt-admin',
            token: 'admin-refresh-token',
            userId: admin.id,
            expiresAt: refreshExpiry,
        },
    });
    await prisma.refreshToken.upsert({
        where: { token: 'editor-refresh-token' },
        update: { userId: editor.id, expiresAt: refreshExpiry },
        create: {
            id: 'rt-editor',
            token: 'editor-refresh-token',
            userId: editor.id,
            expiresAt: refreshExpiry,
        },
    });

    // === Categories & Translations ===
    await prisma.category.upsert({
        where: { id: 'cat-tech' },
        update: {},
        create: { id: 'cat-tech' },
    });
    await prisma.category.upsert({
        where: { id: 'cat-life' },
        update: {},
        create: { id: 'cat-life' },
    });

    await prisma.categoryTranslation.upsert({
        where: { locale_slug: { locale: 'en', slug: 'technology' } },
        update: {
            name: 'Technology',
            slug: 'technology',
            description: 'Technology news and insights',
            categoryId: 'cat-tech',
        },
        create: {
            categoryId: 'cat-tech',
            locale: 'en',
            name: 'Technology',
            slug: 'technology',
            description: 'Technology news and insights',
        },
    });
    await prisma.categoryTranslation.upsert({
        where: { locale_slug: { locale: 'vi', slug: 'cong-nghe' } },
        update: {
            name: 'Cong nghe',
            slug: 'cong-nghe',
            description: 'Tin tuc cong nghe',
            categoryId: 'cat-tech',
        },
        create: {
            categoryId: 'cat-tech',
            locale: 'vi',
            name: 'Cong nghe',
            slug: 'cong-nghe',
            description: 'Tin tuc cong nghe',
        },
    });
    await prisma.categoryTranslation.upsert({
        where: { locale_slug: { locale: 'en', slug: 'lifestyle' } },
        update: {
            name: 'Lifestyle',
            slug: 'lifestyle',
            description: 'Lifestyle and wellbeing',
            categoryId: 'cat-life',
        },
        create: {
            categoryId: 'cat-life',
            locale: 'en',
            name: 'Lifestyle',
            slug: 'lifestyle',
            description: 'Lifestyle and wellbeing',
        },
    });
    await prisma.categoryTranslation.upsert({
        where: { locale_slug: { locale: 'vi', slug: 'phong-cach' } },
        update: {
            name: 'Phong cach',
            slug: 'phong-cach',
            description: 'Phong cach song va suc khoe',
            categoryId: 'cat-life',
        },
        create: {
            categoryId: 'cat-life',
            locale: 'vi',
            name: 'Phong cach',
            slug: 'phong-cach',
            description: 'Phong cach song va suc khoe',
        },
    });
    console.log('Categories seeded');

    // === Tags & Translations ===
    await prisma.tag.upsert({
        where: { id: 'tag-web' },
        update: {},
        create: { id: 'tag-web' },
    });
    await prisma.tag.upsert({
        where: { id: 'tag-node' },
        update: {},
        create: { id: 'tag-node' },
    });

    await prisma.tagTranslation.upsert({
        where: { locale_slug: { locale: 'en', slug: 'web-development' } },
        update: {
            name: 'Web Development',
            slug: 'web-development',
            tagId: 'tag-web',
        },
        create: {
            tagId: 'tag-web',
            locale: 'en',
            name: 'Web Development',
            slug: 'web-development',
        },
    });
    await prisma.tagTranslation.upsert({
        where: { locale_slug: { locale: 'vi', slug: 'lap-trinh-web' } },
        update: {
            name: 'Lap trinh Web',
            slug: 'lap-trinh-web',
            tagId: 'tag-web',
        },
        create: {
            tagId: 'tag-web',
            locale: 'vi',
            name: 'Lap trinh Web',
            slug: 'lap-trinh-web',
        },
    });
    await prisma.tagTranslation.upsert({
        where: { locale_slug: { locale: 'en', slug: 'nodejs' } },
        update: { name: 'Node.js', slug: 'nodejs', tagId: 'tag-node' },
        create: {
            tagId: 'tag-node',
            locale: 'en',
            name: 'Node.js',
            slug: 'nodejs',
        },
    });
    await prisma.tagTranslation.upsert({
        where: { locale_slug: { locale: 'vi', slug: 'nodejs-vi' } },
        update: { name: 'Node.js', slug: 'nodejs-vi', tagId: 'tag-node' },
        create: {
            tagId: 'tag-node',
            locale: 'vi',
            name: 'Node.js',
            slug: 'nodejs-vi',
        },
    });
    console.log('Tags seeded');

    // === Media ===
    const heroImage = await prisma.media.upsert({
        where: { id: 'media-hero' },
        update: {
            filename: 'hero.jpg',
            originalName: 'hero.jpg',
            mimeType: 'image/jpeg',
            size: 320000,
            url: 'https://example.com/media/hero.jpg',
            thumbnailUrl: 'https://example.com/media/hero-thumb.jpg',
            width: 1600,
            height: 900,
            uploaderId: admin.id,
            variants: {
                sm: 'https://example.com/media/hero-sm.jpg',
                webp: 'https://example.com/media/hero.webp',
            },
        },
        create: {
            id: 'media-hero',
            filename: 'hero.jpg',
            originalName: 'hero.jpg',
            mimeType: 'image/jpeg',
            size: 320000,
            url: 'https://example.com/media/hero.jpg',
            thumbnailUrl: 'https://example.com/media/hero-thumb.jpg',
            width: 1600,
            height: 900,
            uploaderId: admin.id,
            variants: {
                sm: 'https://example.com/media/hero-sm.jpg',
                webp: 'https://example.com/media/hero.webp',
            },
        },
    });

    const inlineImage = await prisma.media.upsert({
        where: { id: 'media-inline' },
        update: {
            filename: 'inline.jpg',
            originalName: 'inline.jpg',
            mimeType: 'image/jpeg',
            size: 120000,
            url: 'https://example.com/media/inline.jpg',
            thumbnailUrl: 'https://example.com/media/inline-thumb.jpg',
            width: 1200,
            height: 800,
            uploaderId: author.id,
            variants: {
                sm: 'https://example.com/media/inline-sm.jpg',
                webp: 'https://example.com/media/inline.webp',
            },
        },
        create: {
            id: 'media-inline',
            filename: 'inline.jpg',
            originalName: 'inline.jpg',
            mimeType: 'image/jpeg',
            size: 120000,
            url: 'https://example.com/media/inline.jpg',
            thumbnailUrl: 'https://example.com/media/inline-thumb.jpg',
            width: 1200,
            height: 800,
            uploaderId: author.id,
            variants: {
                sm: 'https://example.com/media/inline-sm.jpg',
                webp: 'https://example.com/media/inline.webp',
            },
        },
    });
    console.log('Media seeded');

    // === Post ===
    const publishDate = new Date();
    const samplePost = await prisma.post.upsert({
        where: { id: 'post-welcome' },
        update: {
            authorId: admin.id,
            status: 'PUBLISHED',
            publishAt: publishDate,
        },
        create: {
            id: 'post-welcome',
            authorId: admin.id,
            status: 'PUBLISHED',
            publishAt: publishDate,
        },
    });

    // Post translations
    const enTranslationData = {
        title: 'Welcome to the Devhunter9x Blog',
        slug: 'welcome-to-the-devhunter9x-blog',
        excerpt: 'This is the first sample post on our bilingual blog.',
        body: '# Welcome!\n\nThis is the first sample post.',
        bodyHtml: '<h1>Welcome!</h1><p>This is the first sample post.</p>',
        metaTitle: 'Welcome to the Devhunter9x Blog',
        metaDescription: 'A Vietnamese-English bilingual blog.',
        heroImageId: heroImage.id,
        schemaType: 'BlogPosting',
        schemaData: {
            type: 'BlogPosting',
            headline: 'Welcome to the Devhunter9x Blog',
        },
    };
    const viTranslationData = {
        title: 'Chao mung den voi Blog devhunter9x',
        slug: 'chao-mung-den-voi-blog-devhunter9x',
        excerpt: 'Day la bai viet mau dau tien tren blog devhunter9x.',
        body: '# Chao mung!\n\nDay la bai viet mau dau tien.',
        bodyHtml: '<h1>Chao mung!</h1><p>Day la bai viet mau dau tien.</p>',
        metaTitle: 'Chao mung den voi Blog devhunter9x',
        metaDescription: 'Blog devhunter9x Viet-Anh.',
        heroImageId: heroImage.id,
        schemaType: 'BlogPosting',
        schemaData: {
            type: 'BlogPosting',
            headline: 'Chao mung den voi Blog devhunter9x',
        },
    };

    await prisma.postTranslation.upsert({
        where: { postId_locale: { postId: samplePost.id, locale: 'en' } },
        update: enTranslationData,
        create: { ...enTranslationData, locale: 'en', postId: samplePost.id },
    });
    await prisma.postTranslation.upsert({
        where: { postId_locale: { postId: samplePost.id, locale: 'vi' } },
        update: viTranslationData,
        create: { ...viTranslationData, locale: 'vi', postId: samplePost.id },
    });

    // Junction tables
    await prisma.categoriesOnPosts.upsert({
        where: {
            postId_categoryId: { postId: samplePost.id, categoryId: 'cat-tech' },
        },
        update: {},
        create: { postId: samplePost.id, categoryId: 'cat-tech' },
    });
    await prisma.tagsOnPosts.upsert({
        where: { postId_tagId: { postId: samplePost.id, tagId: 'tag-web' } },
        update: {},
        create: { postId: samplePost.id, tagId: 'tag-web' },
    });
    await prisma.tagsOnPosts.upsert({
        where: { postId_tagId: { postId: samplePost.id, tagId: 'tag-node' } },
        update: {},
        create: { postId: samplePost.id, tagId: 'tag-node' },
    });
    await prisma.mediaOnPosts.upsert({
        where: { postId_mediaId: { postId: samplePost.id, mediaId: heroImage.id } },
        update: {},
        create: { postId: samplePost.id, mediaId: heroImage.id },
    });
    await prisma.mediaOnPosts.upsert({
        where: {
            postId_mediaId: { postId: samplePost.id, mediaId: inlineImage.id },
        },
        update: {},
        create: { postId: samplePost.id, mediaId: inlineImage.id },
    });
    console.log('Post seeded');

    // === Revisions ===
    await prisma.revision.upsert({
        where: {
            postId_locale_version: {
                postId: samplePost.id,
                locale: 'en',
                version: 1,
            },
        },
        update: { data: enTranslationData, createdById: editor.id },
        create: {
            id: 'rev-en-1',
            postId: samplePost.id,
            locale: 'en',
            version: 1,
            data: enTranslationData,
            createdById: editor.id,
        },
    });
    await prisma.revision.upsert({
        where: {
            postId_locale_version: {
                postId: samplePost.id,
                locale: 'vi',
                version: 1,
            },
        },
        update: { data: viTranslationData, createdById: editor.id },
        create: {
            id: 'rev-vi-1',
            postId: samplePost.id,
            locale: 'vi',
            version: 1,
            data: viTranslationData,
            createdById: editor.id,
        },
    });

    // === Audit Logs ===
    await prisma.auditLog.upsert({
        where: { id: 'audit-post-create' },
        update: {},
        create: {
            id: 'audit-post-create',
            userId: admin.id,
            action: 'CREATE',
            entity: 'Post',
            entityId: samplePost.id,
            newValue: { status: 'PUBLISHED', title: enTranslationData.title },
            ipAddress: '127.0.0.1',
            userAgent: 'seed-script',
        },
    });
    await prisma.auditLog.upsert({
        where: { id: 'audit-user-login' },
        update: {},
        create: {
            id: 'audit-user-login',
            userId: editor.id,
            action: 'LOGIN',
            entity: 'User',
            entityId: editor.id,
            ipAddress: '127.0.0.1',
            userAgent: 'seed-script',
        },
    });

    // === Preview Tokens ===
    const previewTokenValue = 'preview-token-post-welcome';
    await prisma.previewToken.upsert({
        where: { token: previewTokenValue },
        update: {
            postId: samplePost.id,
            locale: 'en',
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
        create: {
            id: 'preview-post-welcome',
            token: previewTokenValue,
            postId: samplePost.id,
            locale: 'en',
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
    });

    // === Webhooks ===
    await prisma.webhook.upsert({
        where: { id: 'webhook-default' },
        update: {
            name: 'Content Events',
            url: 'https://example.com/webhooks/content',
            events: ['post.published', 'post.created'],
            isActive: true,
        },
        create: {
            id: 'webhook-default',
            name: 'Content Events',
            url: 'https://example.com/webhooks/content',
            events: ['post.published', 'post.created'],
            secret: randomUUID(),
            isActive: true,
        },
    });

    // === Settings ===
    await prisma.setting.upsert({
        where: { key: 'site.meta' },
        update: { value: { title: 'Bilingual Tech Blog', defaultLocale: 'en' } },
        create: {
            id: 'setting-site-meta',
            key: 'site.meta',
            value: { title: 'Bilingual Tech Blog', defaultLocale: 'en' },
        },
    });

    // === Generate 100 Posts ===
    console.log('Generating 100 random posts...');
    const users = [admin, editor, author];
    const tags = ['tag-web', 'tag-node'];
    const categories = ['cat-tech', 'cat-life'];

    for (let i = 0; i < 100; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomTagId = tags[Math.floor(Math.random() * tags.length)];
        const randomCategoryId = categories[Math.floor(Math.random() * categories.length)];

        const statusRand = Math.random();
        let status = 'PUBLISHED';
        let publishAt: Date | null = new Date();

        if (statusRand > 0.9) {
            status = 'DRAFT';
            publishAt = null;
        } else if (statusRand > 0.8) {
            status = 'SCHEDULED';
            publishAt = faker.date.future();
        } else {
            publishAt = faker.date.past();
        }

        const heroUrl = `https://picsum.photos/seed/${randomUUID()}/1600/900`;
        const thumbnailUrl = `https://picsum.photos/seed/${randomUUID()}/400/225`;

        const postMedia = await prisma.media.create({
            data: {
                filename: `hero-${i}.jpg`,
                originalName: `hero-${i}.jpg`,
                mimeType: 'image/jpeg',
                size: faker.number.int({ min: 100000, max: 500000 }),
                url: heroUrl,
                thumbnailUrl: thumbnailUrl,
                width: 1600,
                height: 900,
                uploaderId: randomUser.id,
                type: 'IMAGE',
                variants: {
                    sm: thumbnailUrl,
                    webp: heroUrl + '.webp',
                },
            }
        });

        const post = await prisma.post.create({
            data: {
                authorId: randomUser.id,
                status: status as any,
                publishAt: publishAt,
                tags: {
                    create: {
                        tagId: randomTagId,
                    }
                },
                categories: {
                    create: {
                        categoryId: randomCategoryId,
                    }
                },
                translations: {
                    createMany: {
                        data: [
                            {
                                locale: 'en',
                                title: faker.lorem.sentence(),
                                slug: faker.lorem.slug() + '-' + randomUUID(),
                                excerpt: faker.lorem.paragraph(),
                                body: '# ' + faker.lorem.sentence() + '\n\n' + faker.lorem.paragraphs(3) + `\n\n![Image](${heroUrl})\n\n` + faker.lorem.paragraphs(2),
                                bodyHtml: '<h1>' + faker.lorem.sentence() + '</h1><p>' + faker.lorem.paragraphs(3).replace(/\n/g, '</p><p>') + `</p><img src="${heroUrl}" alt="Random Image" /><p>` + faker.lorem.paragraphs(2).replace(/\n/g, '</p><p>') + '</p>',
                                metaTitle: faker.lorem.sentence(),
                                metaDescription: faker.lorem.sentences(2),
                                canonical: faker.internet.url(),
                                ogImage: heroUrl,
                                schemaType: 'Article',
                                heroImageId: postMedia.id
                            },
                            {
                                locale: 'vi',
                                title: faker.lorem.sentence(),
                                slug: faker.lorem.slug() + '-vi-' + randomUUID(),
                                excerpt: faker.lorem.paragraph(),
                                body: '# ' + faker.lorem.sentence() + '\n\n' + faker.lorem.paragraphs(3),
                                bodyHtml: '<h1>' + faker.lorem.sentence() + '</h1><p>' + faker.lorem.paragraphs(3).replace(/\n/g, '</p><p>') + '</p>',
                                metaTitle: faker.lorem.sentence(),
                                metaDescription: faker.lorem.sentences(2),
                                heroImageId: postMedia.id
                            }
                        ]
                    }
                }
            },
        });


        if (Math.random() > 0.5) {
            await prisma.mediaOnPosts.create({
                data: {
                    postId: post.id,
                    mediaId: inlineImage.id
                }
            });
        }

        if (i % 10 === 0) console.log(`Generated ${i} posts...`);
    }

    console.log('Seeding completed!');
    console.log('Test credentials:');
    console.log('  Admin: admin@example.com / admin123');
    console.log('  Editor: editor@example.com / editor123');
    console.log('  Author: author@example.com / author123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
