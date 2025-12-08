'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { type Locale } from '@/i18n';
import ThemeToggle from '@/components/ThemeToggle';
import { getPosts, getTranslation, type Post, type PostTranslation } from '@/lib/api';

export default function HomePage() {
    const params = useParams();
    const locale = (params.locale as Locale) || 'vi';
    const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
    const [latestPosts, setLatestPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const result = await getPosts({ locale, limit: 5 });
                const posts = result.data || [];
                setFeaturedPosts(posts.slice(0, 2));
                setLatestPosts(posts.slice(2, 5));
            } catch (err) {
                console.error('Failed to fetch posts:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [locale]);

    return (
        <div className="min-h-screen">
            <Header locale={locale} />
            <HeroSection locale={locale} />
            <FeaturedPosts locale={locale} posts={featuredPosts} loading={loading} />
            <LatestPosts locale={locale} posts={latestPosts} loading={loading} />
            <Newsletter locale={locale} />
            <Footer locale={locale} />
        </div>
    );
}

function Header({ locale }: { locale: Locale }) {
    const t = useTranslations('common');
    const otherLocale = locale === 'vi' ? 'en' : 'vi';

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/95 border-b border-[var(--color-border)] backdrop-blur-sm shadow-sm">
            <div className="container">
                <nav className="flex items-center justify-between h-16">
                    <Link href={`/${locale}`} className="text-xl font-semibold text-[var(--color-text)]">Blog</Link>
                    <div className="hidden md:flex items-center gap-8">
                        <Link href={`/${locale}`} className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">{t('home')}</Link>
                        <Link href={`/${locale}/blog`} className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">{t('blog')}</Link>
                        <Link href={`/${locale}/about`} className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">{t('about')}</Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link href={`/${otherLocale}`} className="text-sm font-medium px-3 py-1.5 rounded-full border border-[var(--color-border)] hover:border-[var(--color-primary)]">{t('switchLanguage')}</Link>
                    </div>
                </nav>
            </div>
        </header>
    );
}

function HeroSection({ locale }: { locale: Locale }) {
    const t = useTranslations('home');
    return (
        <section className="pt-28 pb-20 bg-[var(--gradient-hero)] border-b border-[var(--color-border)]">
            <div className="container">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-[var(--color-border)] shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                        <span className="text-sm font-medium text-[var(--color-text-secondary)]">{locale === 'vi' ? 'Chia sẻ kiến thức thực chiến' : 'Practical, calm writing'}</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-[var(--color-text)] leading-tight">{t('title')}</h1>
                    <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                        {t('description')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href={`/${locale}/blog`} className="btn btn-primary">{t('featured')} →</Link>
                        <Link href={`/${locale}/blog`} className="btn btn-secondary">{locale === 'vi' ? 'Xem bài viết mới' : 'See latest posts'}</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

function FeaturedPosts({ locale, posts, loading }: { locale: Locale; posts: Post[]; loading: boolean }) {
    const t = useTranslations('home');

    if (loading) {
        return (
            <section className="py-16 bg-[var(--color-background)]">
                <div className="container"><div className="text-center animate-pulse text-[var(--color-text-muted)]">Loading...</div></div>
            </section>
        );
    }

    if (posts.length === 0) {
        return (
            <section className="py-16 bg-[var(--color-background)]">
                <div className="container"><div className="text-center text-[var(--color-text-muted)]">{locale === 'vi' ? 'Chưa có bài viết' : 'No posts yet'}</div></div>
            </section>
        );
    }

    return (
        <section className="py-16 bg-[var(--color-background)]">
            <div className="container">
                <div className="flex items-center justify-between mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text)]">{t('featured')}</h2>
                    <Link href={`/${locale}/blog`} className="text-[var(--color-primary)] hover:underline font-medium">{t('viewAll')} →</Link>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    {posts.map((post, index) => {
                        const trans = getTranslation(post.translations, locale) as PostTranslation | undefined;
                        if (!trans) return null;
                        return (
                            <article key={post.id} className="group bg-[var(--color-surface)] rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-sm card-hover animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className="aspect-[16/9] overflow-hidden bg-[var(--color-surface-light)]">
                                    {trans.heroImage?.url ? (
                                        <img src={trans.heroImage.url} alt={trans.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)] text-4xl font-bold bg-[var(--color-surface-light)]">
                                            {trans.title.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)] mb-3">
                                        <span>{new Date(post.createdAt).toLocaleDateString(locale)}</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                                        <Link href={`/${locale}/blog/${trans.slug}`}>{trans.title}</Link>
                                    </h3>
                                    <p className="text-[var(--color-text-secondary)]">{trans.excerpt}</p>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function LatestPosts({ locale, posts, loading }: { locale: Locale; posts: Post[]; loading: boolean }) {
    const t = useTranslations('home');

    if (loading || posts.length === 0) return null;

    return (
        <section className="py-16">
            <div className="container">
                <h2 className="text-3xl md:text-4xl font-bold mb-10 text-[var(--color-text)]">{t('latest')}</h2>
                <div className="space-y-4">
                    {posts.map((post, index) => {
                        const trans = getTranslation(post.translations, locale) as PostTranslation | undefined;
                        if (!trans) return null;
                        return (
                            <article key={post.id} className="flex items-center gap-5 p-5 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm card-hover animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-xl bg-[var(--color-surface-light)] text-[var(--color-primary)] font-bold text-lg border border-[var(--color-border)]">
                                    {index + 1}
                                </div>
                                <div className="flex-grow">
                                    <h3 className="text-lg font-semibold hover:text-[var(--color-primary)] transition-colors">
                                        <Link href={`/${locale}/blog/${trans.slug}`}>{trans.title}</Link>
                                    </h3>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-[var(--color-text-muted)]">
                                        <span>{new Date(post.createdAt).toLocaleDateString(locale)}</span>
                                    </div>
                                </div>
                                <Link href={`/${locale}/blog/${trans.slug}`} className="text-[var(--color-primary)] hover:underline">{locale === 'vi' ? 'Đọc' : 'Read'} →</Link>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function Newsletter({ locale }: { locale: Locale }) {
    const t = useTranslations('common');
    return (
        <section className="py-16">
            <div className="container">
                <div className="max-w-3xl mx-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-10 text-center shadow-sm">
                    <h2 className="text-3xl md:text-4xl font-bold mb-3 text-[var(--color-text)]">{t('newsletter')}</h2>
                    <p className="text-lg text-[var(--color-text-secondary)] mb-8">
                        {locale === 'vi' ? 'Nhận những bài viết mới nhất.' : 'Get the latest posts.'}
                    </p>
                    <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                        <input
                            type="email"
                            placeholder={t('email')}
                            className="flex-grow px-4 py-3 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
                        />
                        <button type="submit" className="btn btn-primary min-w-[140px]">{t('subscribe')}</button>
                    </form>
                </div>
            </div>
        </section>
    );
}

function Footer({ locale }: { locale: Locale }) {
    const t = useTranslations('common');
    return (
        <footer className="py-12 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
            <div className="container">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-[var(--color-text-muted)]">{t('footer.copyright')}</div>
                    <div className="flex items-center gap-6 text-sm">
                        <Link href={`/${locale}/privacy`} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">{t('footer.privacy')}</Link>
                        <Link href={`/${locale}/terms`} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">{t('footer.terms')}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
