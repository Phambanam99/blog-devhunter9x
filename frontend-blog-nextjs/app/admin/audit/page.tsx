'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminSidebar from '../components/AdminSidebar';

interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    userName: string;
    details: string;
    createdAt: string;
}

export default function AuditPage() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.push('/admin/login');
        if (!isLoading && user?.role !== 'ADMIN') router.push('/admin/dashboard');
    }, [isAuthenticated, isLoading, router, user]);

    const logs: AuditLog[] = [
        { id: '1', action: 'CREATE', entityType: 'Post', entityId: 'p1', userId: 'u1', userName: 'Admin', details: 'Created post "Hello World"', createdAt: '2024-12-06T14:30:00Z' },
        { id: '2', action: 'UPDATE', entityType: 'Post', entityId: 'p1', userId: 'u2', userName: 'Editor', details: 'Updated post status to PUBLISHED', createdAt: '2024-12-06T14:35:00Z' },
        { id: '3', action: 'LOGIN', entityType: 'User', entityId: 'u1', userId: 'u1', userName: 'Admin', details: 'User logged in', createdAt: '2024-12-06T08:00:00Z' },
        { id: '4', action: 'DELETE', entityType: 'Media', entityId: 'm1', userId: 'u1', userName: 'Admin', details: 'Deleted image "old-photo.jpg"', createdAt: '2024-12-05T16:45:00Z' },
        { id: '5', action: 'CREATE', entityType: 'Category', entityId: 'c1', userId: 'u1', userName: 'Admin', details: 'Created category "Technology"', createdAt: '2024-12-05T10:00:00Z' },
    ];

    const actionColors: Record<string, string> = { CREATE: 'admin-badge-success', UPDATE: 'admin-badge-warning', DELETE: 'admin-badge-danger', LOGIN: 'admin-badge-secondary', PUBLISH: 'admin-badge-primary' };

    const filtered = filter === 'all' ? logs : logs.filter(l => l.action === filter);

    if (isLoading || !isAuthenticated) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>;

    return (
        <div className="flex">
            <AdminSidebar user={user} onLogout={logout} />
            <main className="admin-main p-8">
                <div className="flex items-center justify-between mb-8">
                    <div><h1 className="text-2xl font-bold">Audit Log</h1><p className="text-[var(--admin-text-muted)]">System activity history</p></div>
                    <select value={filter} onChange={e => setFilter(e.target.value)} className="admin-select">
                        <option value="all">All Actions</option>
                        <option value="CREATE">Create</option>
                        <option value="UPDATE">Update</option>
                        <option value="DELETE">Delete</option>
                        <option value="LOGIN">Login</option>
                    </select>
                </div>

                <div className="admin-card">
                    <table className="admin-table">
                        <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
                        <tbody>
                            {filtered.map(log => (
                                <tr key={log.id}>
                                    <td className="whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                                    <td><span className="font-medium">{log.userName}</span></td>
                                    <td><span className={`admin-badge ${actionColors[log.action] || 'admin-badge-secondary'}`}>{log.action}</span></td>
                                    <td><code className="text-xs bg-[var(--admin-surface-light)] px-2 py-1 rounded">{log.entityType}</code></td>
                                    <td className="text-[var(--admin-text-muted)]">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
