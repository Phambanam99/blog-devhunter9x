'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDashboardStats, getAdminPosts } from '@/lib/admin-api';

export default function DashboardPage() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [recentPosts, setRecentPosts] = useState<any[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/admin/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchDashboardData();
        }
    }, [isAuthenticated]);

    async function fetchDashboardData() {
        setLoadingStats(true);
        try {
            const [statsRes, postsRes] = await Promise.all([
                getDashboardStats(),
                getAdminPosts({ limit: 5 })
            ]);
            setStats(statsRes);
            setRecentPosts(Array.isArray(postsRes) ? postsRes : postsRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingStats(false);
        }
    }

    if (isLoading || loadingStats) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    const statsData = [
        { label: 'Total Posts', value: stats?.posts?.total || 0, trend: 'Total posts' },
        { label: 'Published', value: stats?.posts?.published || 0, trend: 'Live posts' },
        { label: 'Drafts', value: stats?.posts?.draft || 0, trend: 'In progress' },
        { label: 'Total Users', value: stats?.users?.total || 0, trend: 'Admin users' },
    ];

    return (
        <div className="flex">
            {/* Sidebar */}
            <Sidebar user={user} onLogout={logout} />

            {/* Main Content */}
            <main className="admin-main p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">Dashboard</h1>
                        <p className="text-[var(--admin-text-secondary)]">
                            Welcome back, {user?.name}!
                        </p>
                    </div>
                    <Link href="/admin/posts/new" className="admin-btn admin-btn-primary">
                        + New Post
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statsData.map((stat, index) => (
                        <div
                            key={stat.label}
                            className="admin-stat admin-animate-in"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <p className="text-[var(--admin-text-secondary)] text-sm mb-1">{stat.label}</p>
                            <p className="admin-stat-value">{stat.value}</p>
                            <p className="text-[var(--admin-text-muted)] text-sm mt-2">{stat.trend}</p>
                        </div>
                    ))}
                </div>

                {/* Recent Posts */}
                <div className="admin-card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold">Recent Posts</h2>
                        <Link href="/admin/posts" className="text-sm text-[var(--admin-primary)] hover:underline">
                            View all →
                        </Link>
                    </div>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentPosts.map((post) => {
                                const translation = post.translations?.find((t: any) => t.locale === 'vi') || post.translations?.[0];
                                return (
                                    <tr key={post.id}>
                                        <td>
                                            <Link href={`/admin/posts/${post.id}/edit`} className="hover:text-[var(--admin-primary)] font-medium">
                                                {translation?.title || 'Untitled'}
                                            </Link>
                                        </td>
                                        <td>
                                            <span className={`admin-badge admin-badge-${post.status.toLowerCase()}`}>
                                                {post.status}
                                            </span>
                                        </td>
                                        <td className="text-[var(--admin-text-muted)]">{new Date(post.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <Link
                                                href={`/admin/posts/${post.id}/edit`}
                                                className="text-[var(--admin-primary)] hover:underline text-sm"
                                            >
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}

function Sidebar({ user, onLogout }: { user: any; onLogout: () => void }) {
    //using icon from font-awesome
    const menuItems = [
        { label: 'Dashboard', href: '/admin/dashboard', icon: 'fa-solid fa-chart-line' },
        { label: 'Posts', href: '/admin/posts', icon: 'fa-solid fa-file' },
        { label: 'Media', href: '/admin/media', icon: 'fa-solid fa-image' },
        { label: 'Categories', href: '/admin/categories', icon: 'fa-solid fa-folder' },
        { label: 'Tags', href: '/admin/tags', icon: 'fa-solid fa-tag' },
        { label: 'Users', href: '/admin/users', icon: 'fa-solid fa-user', adminOnly: true },
        { label: 'Audit Log', href: '/admin/audit', icon: 'fa-solid fa-file', adminOnly: true },
    ];

    return (
        <aside className="admin-sidebar">
            {/* Logo */}
            <div className="p-6 border-b border-[var(--admin-border)]">
                <Link href="/admin/dashboard" className="text-xl font-bold text-[var(--admin-primary)]">
                    Blog CMS
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-grow p-4 space-y-1">
                {menuItems.map((item) => {
                    if (item.adminOnly && user?.role !== 'ADMIN') return null;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-light)] hover:text-[var(--admin-text)] transition-colors"
                        >
                            <i className={item.icon}></i>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User */}
            <div className="p-4 border-t border-[var(--admin-border)]">
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--admin-primary)] flex items-center justify-center text-white font-bold">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-grow">
                        <p className="font-medium text-sm">{user?.name}</p>
                        <p className="text-xs text-[var(--admin-text-muted)]">{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full mt-2 px-4 py-2 text-sm text-[var(--admin-text-muted)] hover:text-[var(--admin-danger)] transition-colors text-left"
                >
                    🚪 Sign out
                </button>
            </div>
        </aside>
    );
}
