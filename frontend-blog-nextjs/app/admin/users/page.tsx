'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminUsers, createUser, updateUser, deleteUser } from '@/lib/admin-api';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'EDITOR' | 'AUTHOR';
    createdAt: string;
    lastLogin: string | null;
}

export default function UsersPage() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.push('/admin/login');
        if (!isLoading && user?.role !== 'ADMIN') router.push('/admin/dashboard');
    }, [isAuthenticated, isLoading, router, user]);

    useEffect(() => {
        if (isAuthenticated && user?.role === 'ADMIN') {
            fetchUsers();
        }
    }, [isAuthenticated, user]);

    async function fetchUsers() {
        setLoading(true);
        try {
            const data = await getAdminUsers();
            setUsers(Array.isArray(data) ? data : data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await deleteUser(id);
            fetchUsers();
        } catch (err: any) {
            alert(err.message);
        }
    }

    const roleColors: Record<string, string> = { ADMIN: 'admin-badge-danger', EDITOR: 'admin-badge-warning', AUTHOR: 'admin-badge-secondary' };

    if (isLoading || !isAuthenticated) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>;

    return (
        <div className="flex">
            <Sidebar user={user} onLogout={logout} />
            <main className="admin-main p-8">
                <div className="flex items-center justify-between mb-8">
                    <div><h1 className="text-2xl font-bold">Users</h1><p className="text-[var(--admin-text-muted)]">{users.length} users</p></div>
                    <button onClick={() => { setEditingUser(null); setShowModal(true); }} className="admin-btn admin-btn-primary">+ Invite User</button>
                </div>

                <div className="admin-card">
                    {loading ? <div className="p-8 text-center animate-pulse">Loading...</div> : users.length === 0 ? <div className="p-8 text-center text-[var(--admin-text-muted)]">No users found.</div> : (
                        <table className="admin-table">
                            <thead><tr><th>User</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[var(--admin-primary)] flex items-center justify-center text-white font-bold">{u.name?.charAt(0) || 'U'}</div><div><p className="font-medium">{u.name}</p><p className="text-sm text-[var(--admin-text-muted)]">{u.email}</p></div></div></td>
                                        <td><span className={`admin-badge ${roleColors[u.role] || 'admin-badge-secondary'}`}>{u.role}</span></td>
                                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingUser(u); setShowModal(true); }} className="text-[var(--admin-primary)] hover:underline text-sm">Edit</button>
                                                {u.id !== user?.id && <button onClick={() => handleDelete(u.id)} className="text-[var(--admin-danger)] hover:underline text-sm">Delete</button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {showModal && <UserModal user={editingUser} onClose={() => setShowModal(false)} onSave={fetchUsers} />}
            </main>
        </div>
    );
}

function UserModal({ user: editUser, onClose, onSave }: { user: User | null; onClose: () => void; onSave: () => void }) {
    const [name, setName] = useState(editUser?.name || '');
    const [email, setEmail] = useState(editUser?.email || '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(editUser?.role || 'AUTHOR');
    const [saving, setSaving] = useState(false);

    async function handleSubmit() {
        setSaving(true);
        try {
            const data: any = { name, email, role };
            if (!editUser && password) data.password = password; // Only send password for new users or if changing
            if (editUser && password) data.password = password;

            if (editUser) {
                await updateUser(editUser.id, data);
            } else {
                await createUser(data);
            }
            onSave();
            onClose();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="admin-modal-header"><h2 className="text-xl font-bold">{editUser ? 'Edit User' : 'Create User'}</h2><button onClick={onClose}>✕</button></div>
                <div className="admin-modal-body space-y-4">
                    <div><label className="block text-sm mb-2">Name</label><input value={name} onChange={e => setName(e.target.value)} className="admin-input" placeholder="Full Name" /></div>
                    <div><label className="block text-sm mb-2">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="admin-input" placeholder="user@example.com" /></div>
                    <div><label className="block text-sm mb-2">Password {editUser && '(Leave blank to keep current)'}</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="admin-input" placeholder="Password" /></div>
                    <div><label className="block text-sm mb-2">Role</label><select value={role} onChange={e => setRole(e.target.value as any)} className="admin-select w-full"><option value="ADMIN">Admin</option><option value="EDITOR">Editor</option><option value="AUTHOR">Author</option></select></div>
                </div>
                <div className="admin-modal-footer">
                    <button onClick={onClose} className="admin-btn admin-btn-secondary">Cancel</button>
                    <button onClick={handleSubmit} disabled={saving} className="admin-btn admin-btn-primary">{saving ? 'Saving...' : editUser ? 'Update' : 'Create'}</button>
                </div>
            </div>
        </div>
    );
}

function Sidebar({ user, onLogout }: { user: any; onLogout: () => void }) {
    const items = [
        { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
        { label: 'Posts', href: '/admin/posts', icon: '📝' },
        { label: 'Media', href: '/admin/media', icon: '🖼️' },
        { label: 'Categories', href: '/admin/categories', icon: '📁' },
        { label: 'Tags', href: '/admin/tags', icon: '🏷️' },
        { label: 'Users', href: '/admin/users', icon: '👥', active: true },
        { label: 'Audit', href: '/admin/audit', icon: '📋' },
    ];

    return (
        <aside className="admin-sidebar">
            <div className="p-6 border-b border-[var(--admin-border)]"><Link href="/admin/dashboard" className="text-xl font-bold text-[var(--admin-primary)]">Blog CMS</Link></div>
            <nav className="flex-grow p-4 space-y-1">{items.map(item => <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg ${item.active ? 'bg-[var(--admin-primary)] text-white' : 'text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-light)]'}`}><span>{item.icon}</span><span>{item.label}</span></Link>)}</nav>
            <div className="p-4 border-t border-[var(--admin-border)]"><div className="flex items-center gap-3 px-4 py-3"><div className="w-10 h-10 rounded-full bg-[var(--admin-primary)] flex items-center justify-center text-white font-bold">{user?.name?.charAt(0) || 'U'}</div><div><p className="font-medium text-sm">{user?.name}</p><p className="text-xs text-[var(--admin-text-muted)]">{user?.role}</p></div></div><button onClick={onLogout} className="w-full mt-2 px-4 py-2 text-sm text-[var(--admin-text-muted)] hover:text-[var(--admin-danger)] text-left">🚪 Sign out</button></div>
        </aside>
    );
}
