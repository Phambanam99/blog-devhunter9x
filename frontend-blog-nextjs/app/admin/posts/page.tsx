'use client';

import { useAuth } from '@/lib/auth-context';
import { getAdminPosts, deletePost, publishPost } from '@/lib/admin-api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

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
            <Sidebar user={user} onLogout={logout} />
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

function Sidebar({ user, onLogout }: { user: any; onLogout: () => void }) {
    const items = [
        { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
        { label: 'Posts', href: '/admin/posts', icon: '📝', active: true },
        { label: 'Media', href: '/admin/media', icon: '🖼️' },
        { label: 'Categories', href: '/admin/categories', icon: '📁' },
        { label: 'Tags', href: '/admin/tags', icon: '🏷️' },
        { label: 'Users', href: '/admin/users', icon: '👥', adminOnly: true },
        { label: 'Audit', href: '/admin/audit', icon: '📋', adminOnly: true },
    ];
    return (
        <aside className="admin-sidebar">
            <div className="p-6 border-b border-[var(--admin-border)]"><Link href="/admin/dashboard" className="text-xl font-bold text-[var(--admin-primary)]">Blog CMS</Link></div>
            <nav className="flex-grow p-4 space-y-1">{items.map(item => { if (item.adminOnly && user?.role !== 'ADMIN') return null; return <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg ${item.active ? 'bg-[var(--admin-primary)] text-white' : 'text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-light)]'}`}><span>{item.icon}</span><span>{item.label}</span></Link>; })}</nav>
            <div className="p-4 border-t border-[var(--admin-border)]"><div className="flex items-center gap-3 px-4 py-3"><div className="w-10 h-10 rounded-full bg-[var(--admin-primary)] flex items-center justify-center text-white font-bold">{user?.name?.charAt(0) || 'U'}</div><div><p className="font-medium text-sm">{user?.name}</p><p className="text-xs text-[var(--admin-text-muted)]">{user?.role}</p></div></div><button onClick={onLogout} className="w-full mt-2 px-4 py-2 text-sm text-[var(--admin-text-muted)] hover:text-[var(--admin-danger)] text-left">🚪 Sign out</button></div>
        </aside>
    );
}
