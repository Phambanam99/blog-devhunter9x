'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminPost, updatePost, getAdminCategories, getAdminTags, uploadMedia } from '@/lib/admin-api';
import { MetaPreview } from '@/components/MetaPreview';
import { MediaSelector, MediaItem } from '@/components/MediaSelector';
import AdminSidebar from '../../../components/AdminSidebar';

type Locale = 'vi' | 'en';

interface Translation {
    locale: Locale;
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    metaTitle: string;
    metaDescription: string;
}

export default function EditPostPage() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const params = useParams();
    const postId = params.id as string;
    const [activeLocale, setActiveLocale] = useState<Locale>('vi');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingPost, setIsLoadingPost] = useState(true);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [mediaContext, setMediaContext] = useState<'hero' | 'body'>('hero');

    const [translations, setTranslations] = useState<Record<Locale, Translation>>({
        vi: { locale: 'vi', title: '', slug: '', excerpt: '', body: '', metaTitle: '', metaDescription: '' },
        en: { locale: 'en', title: '', slug: '', excerpt: '', body: '', metaTitle: '', metaDescription: '' },
    });

    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
    const [categoryIds, setCategoryIds] = useState<string[]>([]);
    const [tagIds, setTagIds] = useState<string[]>([]);
    const [status, setStatus] = useState('DRAFT');
    const [heroImage, setHeroImage] = useState<MediaItem | null>(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.push('/admin/login');
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated && postId) {
            fetchData();
        }
    }, [isAuthenticated, postId]);

    async function fetchData() {
        setIsLoadingPost(true);
        try {
            const [postRes, catsRes, tagsRes] = await Promise.all([
                getAdminPost(postId),
                getAdminCategories(),
                getAdminTags(),
            ]);

            // Setup Categories
            const validCats = Array.isArray(catsRes) ? catsRes : catsRes.data || [];
            setCategories(validCats.map((c: any) => ({
                id: c.id,
                name: c.translations?.find((t: any) => t.locale === 'vi')?.name || 'Unnamed',
            })));

            // Setup Tags
            const validTags = Array.isArray(tagsRes) ? tagsRes : tagsRes.data || [];
            setTags(validTags.map((t: any) => ({
                id: t.id,
                name: t.translations?.find((tr: any) => tr.locale === 'vi')?.name || 'Unnamed',
            })));

            // Setup Post Data
            const post = postRes;
            setStatus(post.status);

            // Find hero image from any translation (assuming same for all)
            const translationWithImage = post.translations?.find((t: any) => t.heroImage);
            setHeroImage(translationWithImage?.heroImage || null);

            setCategoryIds(post.categories?.map((c: any) => c.categoryId) || []);
            setTagIds(post.tags?.map((t: any) => t.tagId) || []);

            const newTranslations = { ...translations };
            post.translations.forEach((t: any) => {
                if (t.locale === 'vi' || t.locale === 'en') {
                    newTranslations[t.locale as Locale] = {
                        locale: t.locale as Locale,
                        title: t.title || '',
                        slug: t.slug || '',
                        excerpt: t.excerpt || '',
                        body: t.body || '',
                        metaTitle: t.metaTitle || t.title || '',
                        metaDescription: t.metaDescription || t.excerpt || '',
                    };
                }
            });
            setTranslations(newTranslations);

        } catch (err: any) {
            alert(`Failed to load post: ${err.message}`);
            router.push('/admin/posts');
        } finally {
            setIsLoadingPost(false);
        }
    }

    function updateTranslation(locale: Locale, field: keyof Translation, value: string) {
        setTranslations(prev => ({ ...prev, [locale]: { ...prev[locale], [field]: value } }));
    }

    async function handleSave(saveStatus: string) {
        setIsSaving(true);
        try {
            const payload = {
                translations: Object.values(translations).map(t => ({
                    ...t,
                    heroImageId: heroImage?.id || undefined
                })),
                categoryIds,
                tagIds,
                status: saveStatus,
            };
            await updatePost(postId, payload);

            // If publishing, trigger revalidation
            if (saveStatus === 'PUBLISHED') {
                try {
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/revalidate?secret=${process.env.REVALIDATION_SECRET}&slug=${translations.vi.slug}&locale=vi`, { method: 'POST' });
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/revalidate?secret=${process.env.REVALIDATION_SECRET}&slug=${translations.en.slug}&locale=en`, { method: 'POST' });
                } catch (e) { console.error('Revalidation failed', e); }
            }

            router.push('/admin/posts');
        } catch (error: any) {
            alert(`Failed to save: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    }

    // handleImageUpload removed as we now use MediaSelector

    function handleInsertMedia(media: MediaItem) {
        const isImage = media.mimeType.startsWith('image/');
        const markdown = isImage
            ? `![${media.alt || media.filename}](${media.url})`
            : `<video controls src="${media.url}" width="100%"></video>`;

        const currentBody = translations[activeLocale].body;
        // Append to end
        updateTranslation(activeLocale, 'body', currentBody ? currentBody + '\n' + markdown : markdown);
    }

    if (isLoading || !isAuthenticated || isLoadingPost) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>;
    }

    const currentTranslation = translations[activeLocale];

    return (
        <div className="flex">
            <AdminSidebar user={user} onLogout={logout} />
            <main className="admin-main p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link href="/admin/posts" className="text-[var(--admin-text-muted)] hover:text-[var(--admin-primary)] mb-2 inline-block">← Back to posts</Link>
                        <h1 className="text-2xl font-bold">Edit Post</h1>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => handleSave('DRAFT')} disabled={isSaving} className="admin-btn admin-btn-secondary">Save Draft</button>
                        {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && <button onClick={() => handleSave('PUBLISHED')} disabled={isSaving} className="admin-btn admin-btn-success">Publish</button>}
                    </div>
                </div>

                <div className="flex gap-8">
                    <div className="flex-grow">
                        <div className="admin-tabs">
                            <button onClick={() => setActiveLocale('vi')} className={`admin-tab ${activeLocale === 'vi' ? 'active' : ''}`}>🇻🇳 Tiếng Việt</button>
                            <button onClick={() => setActiveLocale('en')} className={`admin-tab ${activeLocale === 'en' ? 'active' : ''}`}>🇬🇧 English</button>
                        </div>

                        <div className="admin-card mb-6">
                            <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-2">Title ({activeLocale.toUpperCase()})</label>
                            <input type="text" value={currentTranslation.title} onChange={e => updateTranslation(activeLocale, 'title', e.target.value)} className="admin-input text-2xl font-bold" />
                        </div>

                        <div className="admin-card mb-6">
                            <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-2">Slug ({activeLocale.toUpperCase()})</label>
                            <input type="text" value={currentTranslation.slug} onChange={e => updateTranslation(activeLocale, 'slug', e.target.value)} className="admin-input" />
                        </div>

                        <div className="admin-card mb-6">
                            <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-2">Excerpt ({activeLocale.toUpperCase()})</label>
                            <textarea value={currentTranslation.excerpt} onChange={e => updateTranslation(activeLocale, 'excerpt', e.target.value)} className="admin-input h-24 resize-none" />
                        </div>

                        <div className="admin-card mb-6">
                            <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-2 flex justify-between items-center">
                                <span>Content ({activeLocale.toUpperCase()})</span>
                                <button
                                    onClick={() => { setMediaContext('body'); setShowMediaModal(true); }}
                                    className="text-xs bg-[var(--admin-surface-light)] hover:bg-[var(--admin-border)] border border-[var(--admin-border)] px-2 py-1 rounded transition-colors"
                                >
                                    📷 Insert Media
                                </button>
                            </label>
                            <textarea value={currentTranslation.body} onChange={e => updateTranslation(activeLocale, 'body', e.target.value)} className="admin-input h-96 font-mono text-sm resize-none" />
                        </div>

                        <div className="admin-card mb-6">
                            <h3 className="font-semibold mb-4">SEO Settings ({activeLocale.toUpperCase()})</h3>
                            <div className="space-y-4">
                                <div><label className="block text-sm font-medium mb-2">Meta Title</label><input className="admin-input" value={currentTranslation.metaTitle} onChange={e => updateTranslation(activeLocale, 'metaTitle', e.target.value)} /></div>
                                <div><label className="block text-sm font-medium mb-2">Meta Description</label><textarea className="admin-input h-20" value={currentTranslation.metaDescription} onChange={e => updateTranslation(activeLocale, 'metaDescription', e.target.value)} /></div>
                            </div>
                        </div>

                        <div className="admin-card">
                            <h3 className="font-semibold mb-4">Preview ({activeLocale.toUpperCase()})</h3>
                            <MetaPreview
                                title={currentTranslation.metaTitle || currentTranslation.title}
                                description={currentTranslation.metaDescription || currentTranslation.excerpt}
                                url={`http://localhost:3000/${activeLocale}/blog/${currentTranslation.slug}`}
                                image={heroImage ? heroImage.url : undefined}
                            />
                        </div>
                    </div>

                    <div className="w-80 flex-shrink-0 space-y-6">
                        <div className="admin-card">
                            <h3 className="font-semibold mb-4">Status</h3>
                            <select value={status} onChange={e => setStatus(e.target.value)} className="admin-select w-full">
                                <option value="DRAFT">Draft</option>
                                <option value="REVIEW">In Review</option>
                                <option value="PUBLISHED">Published</option>
                            </select>
                        </div>

                        <div className="admin-card">
                            <h3 className="font-semibold mb-4">Categories</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {categories.map(cat => (
                                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={categoryIds.includes(cat.id)} onChange={e => setCategoryIds(e.target.checked ? [...categoryIds, cat.id] : categoryIds.filter(id => id !== cat.id))} />
                                        <span className="text-sm">{cat.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="admin-card">
                            <h3 className="font-semibold mb-4">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <button key={tag.id} onClick={() => setTagIds(tagIds.includes(tag.id) ? tagIds.filter(id => id !== tag.id) : [...tagIds, tag.id])} className={`px-3 py-1 text-sm rounded-full transition-colors ${tagIds.includes(tag.id) ? 'bg-[var(--admin-primary)] text-white' : 'bg-[var(--admin-surface-light)]'}`}>
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="admin-card">
                            <h3 className="font-semibold mb-4">Featured Image</h3>
                            {heroImage ? (
                                <div className="mb-4 relative group">
                                    <img src={heroImage.url} alt="Featured" className="w-full h-auto rounded-lg" />
                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setMediaContext('hero'); setShowMediaModal(true); }} className="bg-white/90 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center hover:bg-white shadow-sm">✎</button>
                                        <button onClick={() => setHeroImage(null)} className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 shadow-sm">×</button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => { setMediaContext('hero'); setShowMediaModal(true); }}
                                    className="border-2 border-dashed border-[var(--admin-border)] rounded-lg p-8 text-center mb-4 cursor-pointer hover:border-[var(--admin-primary)] hover:bg-[var(--admin-surface-light)] transition-all"
                                >
                                    <div className="text-4xl mb-2">🖼️</div>
                                    <p className="text-[var(--admin-text-muted)] text-sm mb-2 font-medium">
                                        Click to select image
                                    </p>
                                    <p className="text-xs text-[var(--admin-text-muted)]">
                                        Choose from library or upload new
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {showMediaModal && (
                <MediaSelector
                    onSelect={(media) => {
                        if (mediaContext === 'hero') {
                            setHeroImage(media);
                        } else {
                            handleInsertMedia(media);
                        }
                        setShowMediaModal(false);
                    }}
                    onCancel={() => setShowMediaModal(false)}
                />

            )}
        </div>
    );
}
