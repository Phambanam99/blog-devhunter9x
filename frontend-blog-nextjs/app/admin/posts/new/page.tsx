'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createPost, getAdminCategories, getAdminTags, uploadMedia } from '@/lib/admin-api';
import { generateSlug } from '@/lib/slug';
import { MediaSelector, MediaItem } from '@/components/MediaSelector';
import { MetaPreview } from '@/components/MetaPreview';
import AdminSidebar from '../../components/AdminSidebar';

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

export default function NewPostPage() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const [activeLocale, setActiveLocale] = useState<Locale>('vi');
    const [isSaving, setIsSaving] = useState(false);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [mediaContext, setMediaContext] = useState<'hero' | 'body'>('hero');

    const [translations, setTranslations] = useState<Record<Locale, Translation>>({
        vi: {
            locale: 'vi',
            title: '',
            slug: '',
            excerpt: '',
            body: '',
            metaTitle: '',
            metaDescription: '',
        },
        en: {
            locale: 'en',
            title: '',
            slug: '',
            excerpt: '',
            body: '',
            metaTitle: '',
            metaDescription: '',
        },
    });

    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
    const [categoryIds, setCategoryIds] = useState<string[]>([]);
    const [tagIds, setTagIds] = useState<string[]>([]);
    const [status, setStatus] = useState('DRAFT');
    const [heroImage, setHeroImage] = useState<MediaItem | null>(null); // Use MediaItem type

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/admin/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);

    async function fetchData() {
        try {
            const [catsRes, tagsRes] = await Promise.all([
                getAdminCategories(),
                getAdminTags(),
            ]);

            // Transform categories to simple list
            const validCats = Array.isArray(catsRes) ? catsRes : catsRes.data || [];
            setCategories(validCats.map((c: any) => ({
                id: c.id,
                name: c.translations?.find((t: any) => t.locale === 'vi')?.name || 'Unnamed',
            })));

            // Transform tags
            const validTags = Array.isArray(tagsRes) ? tagsRes : tagsRes.data || [];
            setTags(validTags.map((t: any) => ({
                id: t.id,
                name: t.translations?.find((tr: any) => tr.locale === 'vi')?.name || 'Unnamed',
            })));

        } catch (err) {
            console.error('Failed to fetch metadata:', err);
        }
    }

    function updateTranslation(locale: Locale, field: keyof Translation, value: string) {
        setTranslations((prev) => ({
            ...prev,
            [locale]: {
                ...prev[locale],
                [field]: value,
            },
        }));
    }

    function handleTitleChange(locale: Locale, value: string) {
        updateTranslation(locale, 'title', value);
        // Auto-generate slug if empty or appears to be auto-generated
        if (!translations[locale].slug || translations[locale].slug === generateSlug(translations[locale].title)) {
            updateTranslation(locale, 'slug', generateSlug(value));
        }
        // Auto-fill meta title if empty
        if (!translations[locale].metaTitle) {
            updateTranslation(locale, 'metaTitle', value);
        }
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

            await createPost(payload);
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
        // Append to end for now
        updateTranslation(activeLocale, 'body', currentBody ? currentBody + '\n' + markdown : markdown);
    }

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    const currentTranslation = translations[activeLocale];

    return (
        <div className="flex">
            <AdminSidebar user={user} onLogout={logout} />

            <main className="admin-main p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link href="/admin/posts" className="text-[var(--admin-text-muted)] hover:text-[var(--admin-primary)] mb-2 inline-block">
                            ← Back to posts
                        </Link>
                        <h1 className="text-2xl font-bold">New Post</h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleSave('DRAFT')}
                            disabled={isSaving}
                            className="admin-btn admin-btn-secondary"
                        >
                            Save Draft
                        </button>
                        {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
                            <button
                                onClick={() => handleSave('PUBLISHED')}
                                disabled={isSaving}
                                className="admin-btn admin-btn-success"
                            >
                                Publish
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-8">
                    {/* Main Editor */}
                    <div className="flex-grow">
                        {/* Language Tabs */}
                        <div className="admin-tabs">
                            <button
                                onClick={() => setActiveLocale('vi')}
                                className={`admin-tab ${activeLocale === 'vi' ? 'active' : ''}`}
                            >
                                🇻🇳 Tiếng Việt
                            </button>
                            <button
                                onClick={() => setActiveLocale('en')}
                                className={`admin-tab ${activeLocale === 'en' ? 'active' : ''}`}
                            >
                                🇬🇧 English
                            </button>
                        </div>

                        {/* Title */}
                        <div className="admin-card mb-6">
                            <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-2">
                                Title ({activeLocale.toUpperCase()})
                            </label>
                            <input
                                type="text"
                                value={currentTranslation.title}
                                onChange={(e) => handleTitleChange(activeLocale, e.target.value)}
                                className="admin-input text-2xl font-bold"
                                placeholder={activeLocale === 'vi' ? 'Tiêu đề bài viết...' : 'Post title...'}
                            />
                        </div>

                        {/* Slug */}
                        <div className="admin-card mb-6">
                            <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-2">
                                Slug ({activeLocale.toUpperCase()})
                            </label>
                            <div className="flex">
                                <span className="inline-flex items-center px-4 bg-[var(--admin-surface-light)] border border-r-0 border-[var(--admin-border)] rounded-l-lg text-[var(--admin-text-muted)]">
                                    /{activeLocale}/blog/
                                </span>
                                <input
                                    type="text"
                                    value={currentTranslation.slug}
                                    onChange={(e) => updateTranslation(activeLocale, 'slug', e.target.value)}
                                    className="admin-input rounded-l-none flex-grow"
                                    placeholder="post-url-slug"
                                />
                            </div>
                        </div>

                        {/* Excerpt */}
                        <div className="admin-card mb-6">
                            <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-2">
                                Excerpt ({activeLocale.toUpperCase()})
                            </label>
                            <textarea
                                value={currentTranslation.excerpt}
                                onChange={(e) => updateTranslation(activeLocale, 'excerpt', e.target.value)}
                                className="admin-input h-24 resize-none"
                                placeholder={activeLocale === 'vi' ? 'Mô tả ngắn về bài viết...' : 'Short description of the post...'}
                            />
                        </div>

                        {/* Body */}
                        <div className="admin-card mb-6">
                            <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-2 flex justify-between items-center">
                                <span>Content ({activeLocale.toUpperCase()}) - Markdown supported</span>
                                <button
                                    onClick={() => { setMediaContext('body'); setShowMediaModal(true); }}
                                    className="text-xs bg-[var(--admin-surface-light)] hover:bg-[var(--admin-border)] border border-[var(--admin-border)] px-2 py-1 rounded transition-colors"
                                >
                                    📷 Insert Media
                                </button>
                            </label>
                            <textarea
                                value={currentTranslation.body}
                                onChange={(e) => updateTranslation(activeLocale, 'body', e.target.value)}
                                className="admin-input h-96 font-mono text-sm resize-none"
                                placeholder={activeLocale === 'vi' ? '# Tiêu đề\n\nNội dung bài viết...' : '# Heading\n\nPost content...'}
                            />
                        </div>

                        {/* SEO */}
                        <div className="admin-card mb-6">
                            <h3 className="font-semibold mb-4">SEO Settings ({activeLocale.toUpperCase()})</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-2">
                                        Meta Title
                                    </label>
                                    <input
                                        type="text"
                                        value={currentTranslation.metaTitle}
                                        onChange={(e) => updateTranslation(activeLocale, 'metaTitle', e.target.value)}
                                        className="admin-input"
                                        placeholder="SEO title (max 60 characters)"
                                    />
                                    <p className="text-xs text-[var(--admin-text-muted)] mt-1">
                                        {currentTranslation.metaTitle.length}/60 characters
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-2">
                                        Meta Description
                                    </label>
                                    <textarea
                                        value={currentTranslation.metaDescription}
                                        onChange={(e) => updateTranslation(activeLocale, 'metaDescription', e.target.value)}
                                        className="admin-input h-20 resize-none"
                                        placeholder="SEO description (max 160 characters)"
                                    />
                                    <p className="text-xs text-[var(--admin-text-muted)] mt-1">
                                        {currentTranslation.metaDescription.length}/160 characters
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Meta Preview */}
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

                    {/* Sidebar */}
                    <div className="w-80 flex-shrink-0 space-y-6">
                        {/* Status */}
                        <div className="admin-card">
                            <h3 className="font-semibold mb-4">Status</h3>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="admin-select w-full"
                            >
                                <option value="DRAFT">Draft</option>
                                <option value="REVIEW">In Review</option>
                                {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
                                    <>
                                        <option value="PUBLISHED">Published</option>
                                        <option value="SCHEDULED">Scheduled</option>
                                    </>
                                )}
                            </select>
                        </div>

                        {/* Categories */}
                        <div className="admin-card">
                            <h3 className="font-semibold mb-4">Categories</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {categories.length === 0 && <p className="text-sm text-[var(--admin-text-muted)]">No categories found. Create one first.</p>}
                                {categories.map((cat) => (
                                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={categoryIds.includes(cat.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setCategoryIds([...categoryIds, cat.id]);
                                                } else {
                                                    setCategoryIds(categoryIds.filter((id) => id !== cat.id));
                                                }
                                            }}
                                            className="rounded border-[var(--admin-border)]"
                                        />
                                        <span className="text-sm">{cat.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="admin-card">
                            <h3 className="font-semibold mb-4">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {tags.length === 0 && <p className="text-sm text-[var(--admin-text-muted)]">No tags found.</p>}
                                {tags.map((tag) => (
                                    <button
                                        key={tag.id}
                                        onClick={() => {
                                            if (tagIds.includes(tag.id)) {
                                                setTagIds(tagIds.filter((id) => id !== tag.id));
                                            } else {
                                                setTagIds([...tagIds, tag.id]);
                                            }
                                        }}
                                        className={`px-3 py-1 text-sm rounded-full transition-colors ${tagIds.includes(tag.id)
                                            ? 'bg-[var(--admin-primary)] text-white'
                                            : 'bg-[var(--admin-surface-light)] hover:bg-[var(--admin-border)]'
                                            }`}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Featured Image */}
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
