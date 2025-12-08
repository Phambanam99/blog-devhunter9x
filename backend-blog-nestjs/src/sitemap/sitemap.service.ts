import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma';

interface SitemapUrl {
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: number;
    alternates?: { hreflang: string; href: string }[];
}

@Injectable()
export class SitemapService {
    private siteUrl: string;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        this.siteUrl = this.configService.get<string>('app.siteUrl') || 'http://localhost:3000';
    }

    async generateSitemap(): Promise<string> {
        const urls: SitemapUrl[] = [];

        // Static pages
        const locales = ['vi', 'en'];
        for (const locale of locales) {
            urls.push({
                loc: `${this.siteUrl}/${locale}`,
                changefreq: 'daily',
                priority: 1.0,
                alternates: locales.map((l) => ({
                    hreflang: l,
                    href: `${this.siteUrl}/${l}`,
                })),
            });

            urls.push({
                loc: `${this.siteUrl}/${locale}/blog`,
                changefreq: 'daily',
                priority: 0.9,
                alternates: locales.map((l) => ({
                    hreflang: l,
                    href: `${this.siteUrl}/${l}/blog`,
                })),
            });
        }

        // Posts
        const posts = await this.prisma.post.findMany({
            where: {
                status: 'PUBLISHED',
                OR: [
                    { publishAt: null },
                    { publishAt: { lte: new Date() } },
                ],
            },
            include: { translations: true },
        });

        for (const post of posts) {
            for (const translation of post.translations) {
                const alternates = post.translations.map((t) => ({
                    hreflang: t.locale,
                    href: `${this.siteUrl}/${t.locale}/blog/${t.slug}`,
                }));

                urls.push({
                    loc: `${this.siteUrl}/${translation.locale}/blog/${translation.slug}`,
                    lastmod: post.updatedAt.toISOString(),
                    changefreq: 'weekly',
                    priority: 0.8,
                    alternates,
                });
            }
        }

        // Categories
        const categories = await this.prisma.category.findMany({
            include: { translations: true },
        });

        for (const category of categories) {
            for (const translation of category.translations) {
                const alternates = category.translations.map((t) => ({
                    hreflang: t.locale,
                    href: `${this.siteUrl}/${t.locale}/category/${t.slug}`,
                }));

                urls.push({
                    loc: `${this.siteUrl}/${translation.locale}/category/${translation.slug}`,
                    changefreq: 'weekly',
                    priority: 0.6,
                    alternates,
                });
            }
        }

        // Tags
        const tags = await this.prisma.tag.findMany({
            include: { translations: true },
        });

        for (const tag of tags) {
            for (const translation of tag.translations) {
                const alternates = tag.translations.map((t) => ({
                    hreflang: t.locale,
                    href: `${this.siteUrl}/${t.locale}/tag/${t.slug}`,
                }));

                urls.push({
                    loc: `${this.siteUrl}/${translation.locale}/tag/${translation.slug}`,
                    changefreq: 'weekly',
                    priority: 0.5,
                    alternates,
                });
            }
        }

        return this.buildSitemapXml(urls);
    }

    async generateRss(locale: string): Promise<string> {
        const siteName = this.configService.get<string>('app.siteName') || 'My Blog';

        const posts = await this.prisma.post.findMany({
            where: {
                status: 'PUBLISHED',
                OR: [
                    { publishAt: null },
                    { publishAt: { lte: new Date() } },
                ],
            },
            include: {
                translations: {
                    where: { locale },
                },
                author: {
                    select: { name: true },
                },
            },
            orderBy: { publishAt: 'desc' },
            take: 50,
        });

        const items = posts
            .filter((p) => p.translations.length > 0)
            .map((post) => {
                const t = post.translations[0];
                return `
    <item>
      <title><![CDATA[${t.title}]]></title>
      <link>${this.siteUrl}/${locale}/blog/${t.slug}</link>
      <guid isPermaLink="true">${this.siteUrl}/${locale}/blog/${t.slug}</guid>
      <description><![CDATA[${t.excerpt || t.metaDescription || ''}]]></description>
      <pubDate>${(post.publishAt || post.createdAt).toUTCString()}</pubDate>
      <author>${post.author.name}</author>
    </item>`;
            })
            .join('');

        return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteName} (${locale.toUpperCase()})</title>
    <link>${this.siteUrl}/${locale}</link>
    <description>${siteName} - ${locale === 'vi' ? 'Blog tiếng Việt' : 'English Blog'}</description>
    <language>${locale}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${this.siteUrl}/api/rss/${locale}.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;
    }

    private buildSitemapXml(urls: SitemapUrl[]): string {
        const urlElements = urls
            .map((u) => {
                let alternateLinks = '';
                if (u.alternates && u.alternates.length > 1) {
                    alternateLinks = u.alternates
                        .map(
                            (alt) =>
                                `\n    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`,
                        )
                        .join('');
                }

                return `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}${u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : ''}${u.priority !== undefined ? `\n    <priority>${u.priority}</priority>` : ''}${alternateLinks}
  </url>`;
            })
            .join('\n');

        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlElements}
</urlset>`;
    }
}
