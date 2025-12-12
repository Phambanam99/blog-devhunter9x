import { MetadataRoute } from 'next';

const API_URL = process.env.BACKEND_URL
    ? `${process.env.BACKEND_URL}/api`
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://blog.devhunter9x.qzz.io';

interface Post {
    id: string;
    updatedAt: string;
    translations: Array<{
        locale: string;
        slug: string;
    }>;
}

async function getPosts(): Promise<Post[]> {
    try {
        const res = await fetch(`${API_URL}/posts?status=PUBLISHED&limit=1000`, {
            next: { revalidate: 3600 }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.data || [];
    } catch {
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const posts = await getPosts();
    const locales = ['vi', 'en'];

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [];

    for (const locale of locales) {
        staticPages.push({
            url: `${SITE_URL}/${locale}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        });

        staticPages.push({
            url: `${SITE_URL}/${locale}/blog`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        });

        staticPages.push({
            url: `${SITE_URL}/${locale}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        });
    }

    // Blog posts
    const postPages: MetadataRoute.Sitemap = [];

    for (const post of posts) {
        for (const trans of post.translations) {
            postPages.push({
                url: `${SITE_URL}/${trans.locale}/blog/${trans.slug}`,
                lastModified: new Date(post.updatedAt),
                changeFrequency: 'weekly',
                priority: 0.8,
            });
        }
    }

    return [...staticPages, ...postPages];
}
