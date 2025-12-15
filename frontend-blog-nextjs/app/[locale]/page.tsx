'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { type Locale } from '@/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPosts, getTranslation, getOptimizedImageUrl, type Post, type PostTranslation } from '@/lib/api';

export default function HomePage() {
    const params = useParams();
    const locale = (params.locale as Locale) || 'vi';
    const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
    const [latestPosts, setLatestPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const result = await getPosts({ locale, limit: 6 });
                const posts = result.data || [];
                setFeaturedPosts(posts.slice(0, 3));
                setLatestPosts(posts.slice(3, 6));
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
            <Header locale={locale} currentPage="home" />
            {/* Main content wrapper with white background */}
            <main className="bg-[var(--color-surface)] shadow-lg">
                <div className="max-w-6xl mx-auto">
                    <HeroSection locale={locale} />
                    <FeaturedPosts locale={locale} posts={featuredPosts} loading={loading} />
                    <LatestPosts locale={locale} posts={latestPosts} loading={loading} />
                    <Newsletter locale={locale} />
                </div>
            </main>
            <Footer locale={locale} />
        </div>
    );
}


function HeroSection({ locale }: { locale: Locale }) {
    const t = useTranslations('home');
    return (
        <section className="pt-28 pb-20 px-4 lg:px-8">
            <div className="max-w-4xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-surface-light)] border border-[var(--color-border)] shadow-sm">
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
        </section>
    );
}

function FeaturedPosts({ locale, posts, loading }: { locale: Locale; posts: Post[]; loading: boolean }) {
    const t = useTranslations('home');

    if (loading) {
        return (
            <section className="py-16 px-4 lg:px-8">
                <div className="text-center animate-pulse text-[var(--color-text-muted)]">Loading...</div>
            </section>
        );
    }

    if (posts.length === 0) {
        return (
            <section className="py-16 px-4 lg:px-8">
                <div className="text-center text-[var(--color-text-muted)]">{locale === 'vi' ? 'Chưa có bài viết' : 'No posts yet'}</div>
            </section>
        );
    }

    return (
        <section className="py-16 px-4 lg:px-8 border-t border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text)]">{t('featured')}</h2>
                <Link href={`/${locale}/blog`} className="text-[var(--color-primary)] hover:underline font-medium">{t('viewAll')} →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
                {posts.map((post, index) => {
                    const trans = getTranslation(post.translations, locale) as PostTranslation | undefined;
                    if (!trans) return null;
                    return (
                        <article key={post.id} className="group bg-[var(--color-surface-light)] rounded-2xl overflow-hidden border border-[var(--color-border)] card-hover animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="aspect-[16/9] overflow-hidden bg-[var(--color-surface-light)]">
                                {(() => {
                                    const imageUrl = getOptimizedImageUrl(trans.heroImage, 'md');
                                    // First image loads eagerly for better LCP, rest lazy load
                                    const isFirstImage = index === 0;
                                    return imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={trans.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            loading={isFirstImage ? "eager" : "lazy"}
                                            fetchPriority={isFirstImage ? "high" : "auto"}
                                            decoding={isFirstImage ? "sync" : "async"}
                                            width={800}
                                            height={450}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)] text-4xl font-bold bg-[var(--color-surface-light)]">
                                            {trans.title.charAt(0)}
                                        </div>
                                    );
                                })()}
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
        </section>
    );
}

function LatestPosts({ locale, posts, loading }: { locale: Locale; posts: Post[]; loading: boolean }) {
    const t = useTranslations('home');

    if (loading || posts.length === 0) return null;

    return (
        <section className="py-16 px-4 lg:px-8 border-t border-[var(--color-border)]">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[var(--color-text)]">{t('latest')}</h2>
            <div className="space-y-4">
                {posts.map((post, index) => {
                    const trans = getTranslation(post.translations, locale) as PostTranslation | undefined;
                    if (!trans) return null;
                    return (
                        <article key={post.id} className="flex items-center gap-5 p-5 bg-[var(--color-surface-light)] rounded-xl border border-[var(--color-border)] card-hover animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-xl bg-[var(--color-surface)] text-[var(--color-primary)] font-bold text-lg border border-[var(--color-border)]">
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
        </section>
    );
}

function Newsletter({ locale }: { locale: Locale }) {
    const t = useTranslations('common');
    return (
        // min-h prevents CLS by reserving space before content loads
        <section className="py-16 px-4 lg:px-8 border-t border-[var(--color-border)] min-h-[320px]">
            <div className="max-w-3xl mx-auto bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-2xl p-10 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-3 text-[var(--color-text)]">{t('newsletter')}</h2>
                <p className="text-lg text-[var(--color-text-secondary)] mb-8">
                    {locale === 'vi' ? 'Nhận những bài viết mới nhất.' : 'Get the latest posts.'}
                </p>
                <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                    <input
                        type="email"
                        placeholder={t('email')}
                        className="flex-grow px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
                    />
                    <button type="submit" className="btn btn-primary min-w-[140px]">{t('subscribe')}</button>
                </form>
            </div>
        </section>
    );
}
