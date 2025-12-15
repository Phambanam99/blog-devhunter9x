import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { type Locale, locales } from '@/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ReadingProgress, ReadingToc, CollapsibleToc } from '@/components/ReadingProgress';
import ScrollToTop from '@/components/ScrollToTop';
import PostContent from '@/components/PostContent';

const API_URL = process.env.BACKEND_URL
    ? `${process.env.BACKEND_URL}/api`
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');

interface Post {
    id: string;
    createdAt: string;
    updatedAt: string;
    author: { name: string };
    translations: Array<{
        locale: string;
        title: string;
        slug: string;
        excerpt: string;
        body: string;
        bodyHtml: string;
        metaTitle: string;
        metaDescription: string;
        heroImage?: {
            url: string;
            variants?: {
                sm?: string;
                md?: string;
                lg?: string;
                webp?: string;
                thumbnail?: string;
            };
        };
    }>;
    categories: Array<{ category: { translations: Array<{ locale: string; name: string }> } }>;
    tags: Array<{ tag: { translations: Array<{ locale: string; name: string }> } }>;
}

async function getPost(locale: string, slug: string): Promise<Post | null> {
    try {
        const res = await fetch(`${API_URL}/posts/${locale}/${slug}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

// Generate static params for all posts
export async function generateStaticParams() {
    try {
        const res = await fetch(`${API_URL}/posts?limit=100`);
        if (!res.ok) return [];
        const data = await res.json();
        const posts = data.data || [];
        const params: { locale: string; slug: string }[] = [];
        for (const post of posts) {
            for (const trans of post.translations || []) {
                params.push({ locale: trans.locale, slug: trans.slug });
            }
        }
        return params;
    } catch {
        return [];
    }
}

// Generate metadata with hreflang
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
    const { locale, slug } = await params;
    const post = await getPost(locale, slug);

    if (!post) {
        return { title: 'Not Found' };
    }

    const currentTrans = post.translations.find(t => t.locale === locale) || post.translations[0];
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Build alternate language links
    const languages: Record<string, string> = {};
    for (const trans of post.translations) {
        languages[trans.locale] = `${siteUrl}/${trans.locale}/blog/${trans.slug}`;
    }

    return {
        title: currentTrans.metaTitle || currentTrans.title,
        description: currentTrans.metaDescription || currentTrans.excerpt,
        openGraph: {
            title: currentTrans.metaTitle || currentTrans.title,
            description: currentTrans.metaDescription || currentTrans.excerpt,
            type: 'article',
            publishedTime: post.createdAt,
            modifiedTime: post.updatedAt,
            authors: [post.author?.name],
            images: currentTrans.heroImage?.url ? [
                {
                    url: currentTrans.heroImage.url.startsWith('http')
                        ? currentTrans.heroImage.url
                        : `${siteUrl}${currentTrans.heroImage.url}`,
                    width: 1200,
                    height: 630,
                    alt: currentTrans.title,
                },
            ] : [
                {
                    url: `${siteUrl}/og-image.png`,
                    width: 1200,
                    height: 630,
                    alt: 'Blog Devhunter9x',
                },
            ],
            locale: locale,
            alternateLocale: locales.filter(l => l !== locale),
        },
        twitter: {
            card: 'summary_large_image',
            title: currentTrans.metaTitle || currentTrans.title,
            description: currentTrans.metaDescription || currentTrans.excerpt,
            images: currentTrans.heroImage?.url ? [currentTrans.heroImage.url] : [],
        },
        alternates: {
            canonical: `${siteUrl}/${locale}/blog/${slug}`,
            languages,
        },
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
    const { locale, slug } = await params;
    const post = await getPost(locale, slug);

    if (!post) {
        notFound();
    }

    const currentTrans = post.translations.find(t => t.locale === locale) || post.translations[0];
    const otherTrans = post.translations.find(t => t.locale !== locale);
    const otherLocale = locale === 'vi' ? 'en' : 'vi';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blog.devhunter9x.qzz.io';

    // JSON-LD Article structured data
    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: currentTrans.title,
        description: currentTrans.excerpt,
        image: currentTrans.heroImage?.url,
        datePublished: post.createdAt,
        dateModified: post.updatedAt,
        author: {
            '@type': 'Person',
            name: post.author?.name,
        },
        publisher: {
            '@type': 'Organization',
            name: 'Blog Devhunter9x',
            url: siteUrl,
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${siteUrl}/${locale}/blog/${slug}`,
        },
        inLanguage: locale,
    };

    // BreadcrumbList for navigation display in search results
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: locale === 'vi' ? 'Trang chủ' : 'Home',
                item: `${siteUrl}/${locale}`
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Blog',
                item: `${siteUrl}/${locale}/blog`
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: currentTrans.title,
                item: `${siteUrl}/${locale}/blog/${slug}`
            }
        ]
    };

    return (
        <>
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />

            {/* hreflang tags */}
            {post.translations.map(trans => (
                <link
                    key={trans.locale}
                    rel="alternate"
                    hrefLang={trans.locale}
                    href={`${siteUrl}/${trans.locale}/blog/${trans.slug}`}
                />
            ))}
            <link rel="alternate" hrefLang="x-default" href={`${siteUrl}/vi/blog/${post.translations.find(t => t.locale === 'vi')?.slug || slug}`} />

            <ReadingProgress targetSelector="#post-content" offset={80} />
            <ScrollToTop />

            <div className="min-h-screen">
                <Header
                    locale={locale as Locale}
                    currentPage="post"
                    altLangHref={otherTrans ? `/${otherLocale}/blog/${otherTrans.slug}` : undefined}
                />

                <main className="pt-24 pb-16">
                    <article className="container max-w-5xl mx-auto">
                        <div className="mb-8">
                            <Link href={`/${locale}/blog`} className="text-[var(--color-primary)] hover:underline mb-4 inline-block">← {locale === 'vi' ? 'Quay lại' : 'Back to Blog'}</Link>
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">{currentTrans.title}</h1>
                            <div className="flex items-center gap-4 text-[var(--color-text-muted)]">
                                <span>{post.author?.name}</span>
                                <span>•</span>
                                <time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleDateString(locale)}</time>
                            </div>
                        </div>

                        <div className="bg-[var(--color-surface)] rounded-2xl p-6 md:p-8 border border-[var(--color-border)] shadow-sm">
                            {currentTrans.heroImage && (
                                <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-8">
                                    <img
                                        src={currentTrans.heroImage.variants?.lg || currentTrans.heroImage.variants?.md || currentTrans.heroImage.url}
                                        alt={currentTrans.title}
                                        className="w-full h-full object-cover"
                                        fetchPriority="high"
                                        width={1200}
                                        height={675}
                                    />
                                </div>
                            )}

                            {(post.categories?.length > 0 || post.tags?.length > 0) && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {post.categories?.map(({ category }, i) => {
                                        const catTrans = category.translations?.find(t => t.locale === locale) || category.translations?.[0];
                                        return catTrans ? <span key={i} className="px-3 py-1 bg-[var(--color-primary)] text-white text-sm rounded-full">{catTrans.name}</span> : null;
                                    })}
                                    {post.tags?.map(({ tag }, i) => {
                                        const tagTrans = tag.translations?.find(t => t.locale === locale) || tag.translations?.[0];
                                        return tagTrans ? <span key={i} className="px-3 py-1 bg-[var(--color-border)] text-sm rounded-full">{tagTrans.name}</span> : null;
                                    })}
                                </div>
                            )}

                            {/* Mobile TOC - after tags */}
                            <CollapsibleToc
                                title={locale === 'vi' ? 'Mục lục' : 'Contents'}
                                targetSelector="#post-content"
                            />
                            <PostContent html={currentTrans.bodyHtml || currentTrans.body} />

                            <div className="mt-12 p-6 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-2xl font-bold">{post.author?.name?.charAt(0) || 'A'}</div>
                                    <div>
                                        <h3 className="font-bold text-lg">{post.author?.name}</h3>
                                        <p className="text-[var(--color-text-muted)]">{locale === 'vi' ? 'Tác giả' : 'Author'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Feedback CTA */}
                            <div className="mt-8 p-6 bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10 rounded-2xl border border-[var(--color-primary)]/20">
                                <div className="text-center">
                                    <h3 className="text-xl font-bold mb-2 text-[var(--color-text)]">
                                        {locale === 'vi' ? 'Bạn có góp ý cho bài viết này?' : 'Have feedback for this article?'}
                                    </h3>
                                    <p className="text-[var(--color-text-secondary)] mb-4">
                                        {locale === 'vi'
                                            ? 'Mọi đóng góp ý kiến của bạn đều rất có giá trị và giúp chúng tôi cải thiện nội dung. Hãy gửi email cho chúng tôi!'
                                            : 'Your feedback is valuable and helps us improve our content. Feel free to email us!'}
                                    </p>
                                    <a
                                        href={`mailto:admin@devhunter9x.qzz.io?subject=${encodeURIComponent(locale === 'vi' ? `Góp ý: ${currentTrans.title}` : `Feedback: ${currentTrans.title}`)}`}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:bg-[var(--color-primary-dark)] transition-colors"
                                    >
                                        <i className="fa-solid fa-envelope"></i>
                                        {locale === 'vi' ? 'Gửi góp ý' : 'Send Feedback'}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </article>
                </main>

                <Footer locale={locale as Locale} />
            </div >
        </>
    );
}
