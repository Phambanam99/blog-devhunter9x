'use client';

import { useAuth } from '@/lib/auth-context';
import { getAdminPosts, deletePost, publishPost } from '@/lib/admin-api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminSidebar from '../components/AdminSidebar';

interface Post {
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    author: { id: string; name: string };
    translations: Array<{ locale: string; title: string; slug: string }>;
}

export default function PostsPage() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.push('/admin/login');
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated) fetchPosts();
    }, [isAuthenticated, statusFilter, searchQuery, page]);

    async function fetchPosts() {
        setLoading(true);
        setError(null);
        try {
            const params: any = { page, limit: 10 };
            if (statusFilter !== 'all') params.status = statusFilter;
            if (searchQuery) params.search = searchQuery;
            const result = await getAdminPosts(params);
            setPosts(result.data || result);
            setTotalPages(result.meta?.totalPages || 1);
        } catch (err: any) {
            setError(err.message);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            await deletePost(id);
            fetchPosts();
        } catch (err: any) {
            alert(err.message);
        }
    }

    async function handlePublish(id: string) {
        try {
            await publishPost(id);
            fetchPosts();
        } catch (err: any) {
            alert(err.message);
        }
    }

    function getTitle(post: Post, locale = 'vi') {
        const trans = post.translations?.find(t => t.locale === locale) || post.translations?.[0];
        return trans?.title || 'Untitled';
    }

    const statusColors: Record<string, string> = {
        DRAFT: 'admin-badge-secondary',
        REVIEW: 'admin-badge-warning',
        PUBLISHED: 'admin-badge-success',
        SCHEDULED: 'admin-badge-primary',
    };

    if (isLoading || !isAuthenticated) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>;
    }

    return (
        <div className="flex">
            <AdminSidebar user={user} onLogout={logout} />
            <main className="admin-main p-8">
                <div className="flex items-center justify-between mb-8">
                    <div><h1 className="text-2xl font-bold">Posts</h1><p className="text-[var(--admin-text-muted)]">{posts.length} posts</p></div>
                    <Link href="/admin/posts/new" className="admin-btn admin-btn-primary">+ New Post</Link>
                </div>

                <div className="admin-card mb-6">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-grow max-w-md">
                            <input type="text" placeholder="Search posts..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} className="admin-input pl-10" />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]">🔍</span>
                        </div>
                        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="admin-select">
                            <option value="all">All Status</option>
                            <option value="DRAFT">Draft</option>
                            <option value="REVIEW">Review</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="SCHEDULED">Scheduled</option>
                        </select>
                        <button onClick={fetchPosts} className="admin-btn admin-btn-secondary">Refresh</button>
                    </div>
                </div>

                {error && <div className="admin-card mb-6 border-[var(--admin-danger)] bg-red-900/20 text-[var(--admin-danger)]">{error}</div>}

                <div className="admin-card">
                    {loading ? (
                        <div className="p-8 text-center animate-pulse">Loading posts...</div>
                    ) : posts.length === 0 ? (
                        <div className="p-8 text-center text-[var(--admin-text-muted)]">No posts found.</div>
                    ) : (
                        <table className="admin-table">
                            <thead><tr><th>Title</th><th>Status</th><th>Author</th><th>Updated</th><th>Actions</th></tr></thead>
                            <tbody>
                                {posts.map(post => (
                                    <tr key={post.id}>
                                        <td className="font-medium">{getTitle(post)}</td>
                                        <td><span className={`admin-badge ${statusColors[post.status] || ''}`}>{post.status}</span></td>
                                        <td>{post.author?.name || 'Unknown'}</td>
                                        <td>{new Date(post.updatedAt).toLocaleDateString()}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                <Link href={`/admin/posts/${post.id}/edit`} className="text-[var(--admin-primary)] hover:underline text-sm">Edit</Link>
                                                {post.status === 'DRAFT' && (user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
                                                    <button onClick={() => handlePublish(post.id)} className="text-[var(--admin-success)] hover:underline text-sm">Publish</button>
                                                )}
                                                <button onClick={() => handleDelete(post.id)} className="text-[var(--admin-danger)] hover:underline text-sm">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="admin-btn admin-btn-secondary">Previous</button>
                        <span className="px-4 py-2">Page {page} of {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="admin-btn admin-btn-secondary">Next</button>
                    </div>
                )}
            </main>
        </div>
    );
}
