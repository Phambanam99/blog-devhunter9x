'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { type Locale } from '@/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPosts, getCategories, getTags, getTranslation, type Post, type PostTranslation, type Category, type Tag } from '@/lib/api';

// Wrapper component with Suspense for useSearchParams
export default function BlogPage() {
    return (
        <Suspense fallback={<BlogPageSkeleton />}>
            <BlogPageContent />
        </Suspense>
    );
}

function BlogPageSkeleton() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-[var(--color-text-muted)]">Loading...</div>
        </div>
    );
}

function BlogPageContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const locale = (params.locale as Locale) || 'vi';
    const t = useTranslations('blog');
    const tCommon = useTranslations('common');

    const [posts, setPosts] = useState<Post[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');

    useEffect(() => {
        fetchData();
    }, [locale, page, searchQuery, selectedCategory, selectedTag]);

    async function fetchData() {
        setLoading(true);
        try {
            const [postsRes, catsRes, tagsRes] = await Promise.all([
                getPosts({
                    locale,
                    page,
                    limit: 6,
                    search: searchQuery || undefined,
                    categoryId: selectedCategory || undefined,
                    tagId: selectedTag || undefined
                }),
                getCategories(locale),
                getTags(locale),
            ]);
            setPosts(postsRes.data || []);
            setTotalPages(postsRes.meta?.totalPages || 1);
            setCategories(Array.isArray(catsRes) ? catsRes : []);
            setTags(Array.isArray(tagsRes) ? tagsRes : []);
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setLoading(false);
        }
    }

    const otherLocale = locale === 'vi' ? 'en' : 'vi';

    return (
        <div className="min-h-screen">
            <Header locale={locale} currentPage="blog" />

            <main className="pt-24 pb-16">
                <div className="container">
                    <h1 className="text-4xl font-bold mb-8 text-[var(--color-text)]">{t('title')}</h1>

                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-grow">
                            {/* Search */}
                            <div className="mb-8">
                                <input
                                    type="text"
                                    placeholder={t('searchPlaceholder')}
                                    value={searchQuery}
                                    onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:border-[var(--color-primary)] focus:outline-none shadow-sm"
                                />
                            </div>

                            {loading ? (
                                <div className="text-center py-12 animate-pulse text-[var(--color-text-muted)]">Loading...</div>
                            ) : posts.length === 0 ? (
                                <div className="text-center py-12 text-[var(--color-text-muted)]">{t('noResults')}</div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-6">
                                    {posts.map(post => {
                                        const trans = getTranslation(post.translations, locale) as PostTranslation | undefined;
                                        if (!trans) return null;
                                        return (
                                            <article key={post.id} className="group bg-[var(--color-surface)] rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-sm card-hover">
                                                <div className="aspect-[16/10] overflow-hidden bg-[var(--color-surface-light)]">
                                                    {(() => {
                                                        const imageUrl = trans.heroImage?.thumbnailUrl || trans.heroImage?.url;
                                                        if (!imageUrl) {
                                                            return (
                                                                <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)] text-3xl font-bold bg-[var(--color-surface-light)]">
                                                                    {trans.title.charAt(0)}
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <img
                                                                src={imageUrl}
                                                                alt={trans.title}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                loading="lazy"
                                                            />
                                                        );
                                                    })()}
                                                </div>
                                                <div className="p-5">
                                                    <div className="text-sm text-[var(--color-text-muted)] mb-2">{new Date(post.createdAt).toLocaleDateString(locale)}</div>
                                                    <h2 className="text-lg font-bold mb-2 group-hover:text-[var(--color-primary)] transition-colors text-[var(--color-text)]">
                                                        <Link href={`/${locale}/blog/${trans.slug}`}>{trans.title}</Link>
                                                    </h2>
                                                    <p className="text-[var(--color-text-secondary)] text-sm line-clamp-2">{trans.excerpt}</p>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className="flex justify-center gap-2 mt-8">
                                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary">{locale === 'vi' ? 'Trước' : 'Previous'}</button>
                                    <span className="px-4 py-2">{page} / {totalPages}</span>
                                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary">{locale === 'vi' ? 'Sau' : 'Next'}</button>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <aside className="w-full lg:w-72 flex-shrink-0 space-y-8">
                            <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                                <h3 className="font-bold mb-4">{t('categories')}</h3>
                                <div className="space-y-2">
                                    <button onClick={() => { setSelectedCategory(''); setPage(1); }} className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${!selectedCategory ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-[var(--color-border)]'}`}>{locale === 'vi' ? 'Tất cả' : 'All'}</button>
                                    {categories.map(cat => {
                                        const trans = getTranslation(cat.translations, locale);
                                        return (
                                            <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setPage(1); }} className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === cat.id ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-[var(--color-border)]'}`}>{trans?.name}</button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                                <h3 className="font-bold mb-4">{t('tags')}</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => { setSelectedTag(''); setPage(1); }}
                                        className={`px-3 py-1 text-sm rounded-full transition-colors ${!selectedTag ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-border)] hover:bg-[var(--color-surface-light)]'}`}
                                    >
                                        {locale === 'vi' ? 'Tất cả' : 'All'}
                                    </button>
                                    {tags.map(tag => {
                                        const trans = getTranslation(tag.translations, locale);
                                        return (
                                            <button
                                                key={tag.id}
                                                onClick={() => { setSelectedTag(selectedTag === tag.id ? '' : tag.id); setPage(1); }}
                                                className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedTag === tag.id ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-border)] hover:bg-[var(--color-surface-light)]'}`}
                                            >
                                                {trans?.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            <Footer locale={locale} />
        </div>
    );
}
