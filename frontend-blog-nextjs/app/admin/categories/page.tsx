'use client';

import { useAuth } from '@/lib/auth-context';
import { getAdminCategories, createCategory, updateCategory, deleteCategory } from '@/lib/admin-api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Category {
    id: string;
    parentId: string | null;
    translations: { locale: string; name: string; slug: string; description: string }[];
    _count?: { posts: number };
}

export default function CategoriesPage() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.push('/admin/login');
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated) fetchCategories();
    }, [isAuthenticated]);

    async function fetchCategories() {
        setLoading(true);
        try {
            const data = await getAdminCategories();
            setCategories(Array.isArray(data) ? data : data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this category?')) return;
        try { await deleteCategory(id); fetchCategories(); } catch (err: any) { alert(err.message); }
    }

    function getTrans(cat: Category, locale: string) {
        return cat.translations?.find(t => t.locale === locale) || cat.translations?.[0] || { name: '', slug: '', description: '' };
    }

    function getParentName(parentId: string | null) {
        if (!parentId) return '—';
        const parent = categories.find(c => c.id === parentId);
        return parent ? getTrans(parent, 'vi').name : '—';
    }

    if (isLoading || !isAuthenticated) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>;

    return (
        <div className="flex">
            <Sidebar user={user} onLogout={logout} />
            <main className="admin-main p-8">
                <div className="flex items-center justify-between mb-8">
                    <div><h1 className="text-2xl font-bold">Categories</h1><p className="text-[var(--admin-text-muted)]">{categories.length} categories</p></div>
                    <button onClick={() => { setEditingCategory(null); setShowModal(true); }} className="admin-btn admin-btn-primary">+ New Category</button>
                </div>

                <div className="admin-card">
                    {loading ? <div className="p-8 text-center animate-pulse">Loading...</div> : categories.length === 0 ? <div className="p-8 text-center text-[var(--admin-text-muted)]">No categories. Create one!</div> : (
                        <table className="admin-table">
                            <thead><tr><th>Name (VI)</th><th>Name (EN)</th><th>Slug</th><th>Parent</th><th>Posts</th><th>Actions</th></tr></thead>
                            <tbody>
                                {categories.map(cat => {
                                    const vi = getTrans(cat, 'vi'); const en = getTrans(cat, 'en');
                                    return (
                                        <tr key={cat.id}>
                                            <td className="font-medium">{cat.parentId && <span className="text-[var(--admin-text-muted)] mr-2">└</span>}{vi.name}</td>
                                            <td>{en.name}</td>
                                            <td><code className="text-xs bg-[var(--admin-surface-light)] px-2 py-1 rounded">{vi.slug}</code></td>
                                            <td className="text-[var(--admin-text-muted)]">{getParentName(cat.parentId)}</td>
                                            <td><span className="admin-badge admin-badge-secondary">{cat._count?.posts || 0}</span></td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setEditingCategory(cat); setShowModal(true); }} className="text-[var(--admin-primary)] hover:underline text-sm">Edit</button>
                                                    <button onClick={() => handleDelete(cat.id)} className="text-[var(--admin-danger)] hover:underline text-sm">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
                {showModal && <CategoryModal category={editingCategory} categories={categories} onClose={() => setShowModal(false)} onSave={fetchCategories} />}
            </main>
        </div>
    );
}

function CategoryModal({ category, categories, onClose, onSave }: { category: Category | null; categories: Category[]; onClose: () => void; onSave: () => void }) {
    const [viName, setViName] = useState(category?.translations?.find(t => t.locale === 'vi')?.name || '');
    const [viSlug, setViSlug] = useState(category?.translations?.find(t => t.locale === 'vi')?.slug || '');
    const [viDesc, setViDesc] = useState(category?.translations?.find(t => t.locale === 'vi')?.description || '');
    const [enName, setEnName] = useState(category?.translations?.find(t => t.locale === 'en')?.name || '');
    const [enSlug, setEnSlug] = useState(category?.translations?.find(t => t.locale === 'en')?.slug || '');
    const [enDesc, setEnDesc] = useState(category?.translations?.find(t => t.locale === 'en')?.description || '');
    const [parentId, setParentId] = useState(category?.parentId || '');
    const [saving, setSaving] = useState(false);

    async function handleSubmit() {
        setSaving(true);
        try {
            const allTranslations = [
                { locale: 'vi', name: viName, slug: viSlug, description: viDesc },
                { locale: 'en', name: enName, slug: enSlug, description: enDesc }
            ];
            // Filter out incomplete translations
            const validTranslations = allTranslations.filter(t => t.name.trim() && t.slug.trim());

            if (validTranslations.length === 0) {
                alert('Please provide at least one translation (Name and Slug)');
                setSaving(false);
                return;
            }

            const data = {
                parentId: parentId || undefined,
                translations: validTranslations
            };

            if (category) await updateCategory(category.id, data);
            else await createCategory(data);

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
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
                <div className="admin-modal-header"><h2 className="text-xl font-bold">{category ? 'Edit' : 'New'} Category</h2><button onClick={onClose}>✕</button></div>
                <div className="admin-modal-body space-y-4">
                    <div className="p-4 bg-[var(--admin-surface-light)] rounded-lg">
                        <h3 className="font-semibold mb-3">🇻🇳 Vietnamese</h3>
                        <input value={viName} onChange={e => setViName(e.target.value)} className="admin-input mb-2" placeholder="Name" />
                        <input value={viSlug} onChange={e => setViSlug(e.target.value)} className="admin-input mb-2" placeholder="Slug" />
                        <textarea value={viDesc} onChange={e => setViDesc(e.target.value)} className="admin-input h-16 resize-none" placeholder="Description" />
                    </div>
                    <div className="p-4 bg-[var(--admin-surface-light)] rounded-lg">
                        <h3 className="font-semibold mb-3">🇬🇧 English</h3>
                        <input value={enName} onChange={e => setEnName(e.target.value)} className="admin-input mb-2" placeholder="Name" />
                        <input value={enSlug} onChange={e => setEnSlug(e.target.value)} className="admin-input mb-2" placeholder="Slug" />
                        <textarea value={enDesc} onChange={e => setEnDesc(e.target.value)} className="admin-input h-16 resize-none" placeholder="Description" />
                    </div>
                    <div><label className="block text-sm mb-2">Parent</label><select value={parentId} onChange={e => setParentId(e.target.value)} className="admin-select w-full"><option value="">None</option>{categories.filter(c => c.id !== category?.id && !c.parentId).map(c => <option key={c.id} value={c.id}>{c.translations?.find(t => t.locale === 'vi')?.name}</option>)}</select></div>
                </div>
                <div className="admin-modal-footer"><button onClick={onClose} className="admin-btn admin-btn-secondary">Cancel</button><button onClick={handleSubmit} disabled={saving} className="admin-btn admin-btn-primary">{saving ? 'Saving...' : category ? 'Update' : 'Create'}</button></div>
            </div>
        </div>
    );
}

function Sidebar({ user, onLogout }: { user: any; onLogout: () => void }) {
    const items = [{ label: 'Dashboard', href: '/admin/dashboard', icon: '📊' }, { label: 'Posts', href: '/admin/posts', icon: '📝' }, { label: 'Media', href: '/admin/media', icon: '🖼️' }, { label: 'Categories', href: '/admin/categories', icon: '📁', active: true }, { label: 'Tags', href: '/admin/tags', icon: '🏷️' }, { label: 'Users', href: '/admin/users', icon: '👥', adminOnly: true }, { label: 'Audit', href: '/admin/audit', icon: '📋', adminOnly: true }];
    return (
        <aside className="admin-sidebar">
            <div className="p-6 border-b border-[var(--admin-border)]"><Link href="/admin/dashboard" className="text-xl font-bold text-[var(--admin-primary)]">Blog CMS</Link></div>
            <nav className="flex-grow p-4 space-y-1">{items.map(item => { if (item.adminOnly && user?.role !== 'ADMIN') return null; return <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg ${item.active ? 'bg-[var(--admin-primary)] text-white' : 'text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-light)]'}`}><span>{item.icon}</span><span>{item.label}</span></Link>; })}</nav>
            <div className="p-4 border-t border-[var(--admin-border)]"><div className="flex items-center gap-3 px-4 py-3"><div className="w-10 h-10 rounded-full bg-[var(--admin-primary)] flex items-center justify-center text-white font-bold">{user?.name?.charAt(0) || 'U'}</div><div><p className="font-medium text-sm">{user?.name}</p><p className="text-xs text-[var(--admin-text-muted)]">{user?.role}</p></div></div><button onClick={onLogout} className="w-full mt-2 px-4 py-2 text-sm text-[var(--admin-text-muted)] hover:text-[var(--admin-danger)] text-left">🚪 Sign out</button></div>
        </aside>
    );
}
