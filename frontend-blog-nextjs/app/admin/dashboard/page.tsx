'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDashboardStats, getAdminPosts } from '@/lib/admin-api';
import AdminSidebar from '../components/AdminSidebar';

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
            <AdminSidebar user={user} onLogout={logout} />

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
