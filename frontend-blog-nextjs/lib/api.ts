// Use BACKEND_URL for server-side rendering in Docker, fallback to NEXT_PUBLIC_API_URL for client-side
const API_URL = process.env.BACKEND_URL
    ? `${process.env.BACKEND_URL}/api`
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');

export interface Post {
    id: string;
    authorId: string;
    status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'SCHEDULED';
    publishAt: string | null;
    createdAt: string;
    updatedAt: string;
    translations: PostTranslation[];
    author: {
        id: string;
        name: string;
        avatar: string | null;
    };
    categories: Array<{
        category: {
            id: string;
            translations: CategoryTranslation[];
        };
    }>;
    tags: Array<{
        tag: {
            id: string;
            translations: TagTranslation[];
        };
    }>;
}

export interface PostTranslation {
    id: string;
    postId: string;
    locale: string;
    title: string;
    slug: string;
    excerpt: string | null;
    body: string;
    bodyHtml: string;
    metaTitle: string | null;
    metaDescription: string | null;
    canonical: string | null;
    ogImage: string | null;
    heroImage: Media | null;
}

export interface Category {
    id: string;
    parentId: string | null;
    translations: CategoryTranslation[];
    children?: Category[];
    _count?: { posts: number };
}

export interface CategoryTranslation {
    id: string;
    categoryId: string;
    locale: string;
    name: string;
    slug: string;
    description: string | null;
}

export interface Tag {
    id: string;
    translations: TagTranslation[];
    _count?: { posts: number };
}

export interface TagTranslation {
    id: string;
    tagId: string;
    locale: string;
    name: string;
    slug: string;
}

export interface Media {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    url: string;
    thumbnailUrl: string | null;
    width: number | null;
    height: number | null;
    variants: Record<string, string> | null;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// Helper to get translation for current locale
export function getTranslation<T extends { locale: string }>(
    translations: T[],
    locale: string
): T | undefined {
    return translations.find((t) => t.locale === locale) || translations[0];
}

// Fetch posts
export async function getPosts(params: {
    locale?: string;
    page?: number;
    limit?: number;
    categoryId?: string;
    tagId?: string;
    search?: string;
}): Promise<PaginatedResponse<Post>> {
    const searchParams = new URLSearchParams();
    if (params.locale) searchParams.set('locale', params.locale);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params.tagId) searchParams.set('tagId', params.tagId);
    if (params.search) searchParams.set('search', params.search);

    const res = await fetch(`${API_URL}/posts?${searchParams.toString()}`, {
        next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
    });

    if (!res.ok) {
        throw new Error('Failed to fetch posts');
    }

    return res.json();
}

// Fetch single post by slug
export async function getPostBySlug(
    locale: string,
    slug: string
): Promise<Post & { currentTranslation: PostTranslation }> {
    const res = await fetch(`${API_URL}/posts/${locale}/${slug}`, {
        next: { revalidate: 60 },
    });

    if (!res.ok) {
        if (res.status === 404) {
            throw new Error('Post not found');
        }
        throw new Error('Failed to fetch post');
    }

    return res.json();
}

// Fetch categories
export async function getCategories(locale?: string): Promise<Category[]> {
    const url = locale
        ? `${API_URL}/categories?locale=${locale}`
        : `${API_URL}/categories`;

    const res = await fetch(url, {
        next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!res.ok) {
        throw new Error('Failed to fetch categories');
    }

    return res.json();
}

// Fetch category by slug
export async function getCategoryBySlug(
    locale: string,
    slug: string
): Promise<Category> {
    const res = await fetch(`${API_URL}/categories/${locale}/${slug}`, {
        next: { revalidate: 3600 },
    });

    if (!res.ok) {
        throw new Error('Failed to fetch category');
    }

    return res.json();
}

// Fetch tags
export async function getTags(locale?: string): Promise<Tag[]> {
    const url = locale ? `${API_URL}/tags?locale=${locale}` : `${API_URL}/tags`;

    const res = await fetch(url, {
        next: { revalidate: 3600 },
    });

    if (!res.ok) {
        throw new Error('Failed to fetch tags');
    }

    return res.json();
}

// Fetch tag by slug
export async function getTagBySlug(locale: string, slug: string): Promise<Tag> {
    const res = await fetch(`${API_URL}/tags/${locale}/${slug}`, {
        next: { revalidate: 3600 },
    });

    if (!res.ok) {
        throw new Error('Failed to fetch tag');
    }

    return res.json();
}

// Preview post
export async function getPreviewPost(token: string): Promise<Post> {
    const res = await fetch(`${API_URL}/preview/${token}`, {
        cache: 'no-store', // Don't cache preview
    });

    if (!res.ok) {
        throw new Error('Invalid or expired preview token');
    }

    return res.json();
}

// On-demand revalidation
export async function revalidatePost(slug: string, secret: string): Promise<void> {
    const res = await fetch(`/api/revalidate?slug=${slug}&secret=${secret}`, {
        method: 'POST',
    });

    if (!res.ok) {
        throw new Error('Failed to revalidate');
    }
}
