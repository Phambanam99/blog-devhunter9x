import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { type Locale, locales } from '@/i18n';
import ThemeToggle from '@/components/ThemeToggle';
import { ReadingProgress, ReadingToc } from '@/components/ReadingProgress';
import DOMPurify from 'isomorphic-dompurify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
        heroImage?: { url: string };
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
            images: currentTrans.heroImage?.url ? [currentTrans.heroImage.url] : [],
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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // JSON-LD structured data
    const jsonLd = {
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
            name: 'Blog',
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${siteUrl}/${locale}/blog/${slug}`,
        },
        inLanguage: locale,
    };

    return (
        <>
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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

            <div className="min-h-screen">
                <header className="fixed top-0 left-0 right-0 z-50 glass">
                    <div className="container">
                        <nav className="flex items-center justify-between h-16">
                            <Link href={`/${locale}`} className="text-xl font-bold gradient-text">Blog</Link>
                            <div className="hidden md:flex items-center gap-8">
                                <Link href={`/${locale}`} className="text-sm font-medium hover:text-[var(--color-primary)]">{locale === 'vi' ? 'Trang chủ' : 'Home'}</Link>
                                <Link href={`/${locale}/blog`} className="text-sm font-medium hover:text-[var(--color-primary)]">{locale === 'vi' ? 'Blog' : 'Blog'}</Link>
                                <Link href={`/${locale}/about`} className="text-sm font-medium hover:text-[var(--color-primary)]">{locale === 'vi' ? 'Giới thiệu' : 'About'}</Link>
                            </div>
                            <div className="flex items-center gap-3">
                                <ThemeToggle />
                                {otherTrans && (
                                    <Link href={`/${otherLocale}/blog/${otherTrans.slug}`} className="text-sm font-medium px-3 py-1.5 rounded-full border border-[var(--color-border)] hover:border-[var(--color-primary)]">
                                        {locale === 'vi' ? 'English' : 'Tiếng Việt'}
                                    </Link>
                                )}
                            </div>
                        </nav>
                    </div>
                </header>

                <main className="pt-24 pb-16">
                    <article className="container max-w-5xl">
                        <div className="mb-8">
                            <Link href={`/${locale}/blog`} className="text-[var(--color-primary)] hover:underline mb-4 inline-block">← {locale === 'vi' ? 'Quay lại' : 'Back to Blog'}</Link>
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">{currentTrans.title}</h1>
                            <div className="flex items-center gap-4 text-[var(--color-text-muted)]">
                                <span>{post.author?.name}</span>
                                <span>•</span>
                                <time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleDateString(locale)}</time>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-[minmax(0,1fr)_260px] gap-8 items-start">
                            <div>
                                {currentTrans.heroImage?.url && (
                                    <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-8">
                                        <img src={currentTrans.heroImage.url} alt={currentTrans.title} className="w-full h-full object-cover" />
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

                                <div
                                    id="post-content"
                                    className="prose prose-lg max-w-none"
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(currentTrans.bodyHtml || currentTrans.body, {
                                            ADD_TAGS: ['video', 'source'],
                                            ADD_ATTR: ['controls', 'src', 'type', 'width', 'height', 'poster']
                                        })
                                    }}
                                />

                                <div className="mt-12 p-6 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-2xl font-bold">{post.author?.name?.charAt(0) || 'A'}</div>
                                        <div>
                                            <h3 className="font-bold text-lg">{post.author?.name}</h3>
                                            <p className="text-[var(--color-text-muted)]">{locale === 'vi' ? 'Tác giả' : 'Author'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <ReadingToc
                                title={locale === 'vi' ? 'Phụ lục' : 'Contents'}
                                targetSelector="#post-content"
                            />
                        </div>
                    </article>
                </main>

                <footer className="py-8 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
                    <div className="container text-center text-[var(--color-text-muted)]">© 2024 Blog. {locale === 'vi' ? 'Bảo lưu mọi quyền.' : 'All rights reserved.'}</div>
                </footer>
            </div>
        </>
    );
}
