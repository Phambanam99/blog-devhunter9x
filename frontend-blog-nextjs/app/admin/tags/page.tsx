'use client';

import { useAuth } from '@/lib/auth-context';
import { getAdminTags, createTag, updateTag, deleteTag } from '@/lib/admin-api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminSidebar from '../components/AdminSidebar';

interface Tag {
    id: string;
    translations: { locale: string; name: string; slug: string }[];
    _count?: { posts: number };
}

export default function TagsPage() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) router.push('/admin/login');
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated) fetchTags();
    }, [isAuthenticated]);

    async function fetchTags() {
        setLoading(true);
        try {
            const data = await getAdminTags();
            setTags(Array.isArray(data) ? data : data.data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this tag?')) return;
        try { await deleteTag(id); fetchTags(); } catch (err: any) { alert(err.message); }
    }

    function getTrans(tag: Tag, locale: string) {
        return tag.translations?.find(t => t.locale === locale) || tag.translations?.[0] || { name: '', slug: '' };
    }

    if (isLoading || !isAuthenticated) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>;

    return (
        <div className="flex">
            <AdminSidebar user={user} onLogout={logout} />
            <main className="admin-main p-8">
                <div className="flex items-center justify-between mb-8">
                    <div><h1 className="text-2xl font-bold">Tags</h1><p className="text-[var(--admin-text-muted)]">{tags.length} tags</p></div>
                    <button onClick={() => { setEditingTag(null); setShowModal(true); }} className="admin-btn admin-btn-primary">+ New Tag</button>
                </div>

                {loading ? <div className="animate-pulse text-center p-8">Loading...</div> : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {tags.map(tag => (
                            <div key={tag.id} className="admin-card hover:border-[var(--admin-primary)] cursor-pointer" onClick={() => { setEditingTag(tag); setShowModal(true); }}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--admin-primary)] to-purple-600 flex items-center justify-center text-white font-bold">#</div>
                                    <span className="admin-badge admin-badge-secondary">{tag._count?.posts || 0}</span>
                                </div>
                                <h3 className="font-semibold">{getTrans(tag, 'vi').name}</h3>
                                <p className="text-xs text-[var(--admin-text-muted)] mt-1">/{getTrans(tag, 'vi').slug}</p>
                            </div>
                        ))}
                    </div>
                )}
                {showModal && <TagModal tag={editingTag} onClose={() => setShowModal(false)} onSave={fetchTags} onDelete={handleDelete} />}
            </main>
        </div>
    );
}

function TagModal({ tag, onClose, onSave, onDelete }: { tag: Tag | null; onClose: () => void; onSave: () => void; onDelete: (id: string) => void }) {
    const [viName, setViName] = useState(tag?.translations?.find(t => t.locale === 'vi')?.name || '');
    const [viSlug, setViSlug] = useState(tag?.translations?.find(t => t.locale === 'vi')?.slug || '');
    const [enName, setEnName] = useState(tag?.translations?.find(t => t.locale === 'en')?.name || '');
    const [enSlug, setEnSlug] = useState(tag?.translations?.find(t => t.locale === 'en')?.slug || '');
    const [saving, setSaving] = useState(false);

    async function handleSubmit() {
        setSaving(true);
        try {
            const data = { translations: [{ locale: 'vi', name: viName, slug: viSlug }, { locale: 'en', name: enName, slug: enSlug }] };
            if (tag) await updateTag(tag.id, data); else await createTag(data);
            onSave(); onClose();
        } catch (err: any) { alert(err.message); } finally { setSaving(false); }
    }

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="admin-modal-header"><h2 className="text-xl font-bold">{tag ? 'Edit' : 'New'} Tag</h2><button onClick={onClose}>✕</button></div>
                <div className="admin-modal-body space-y-4">
                    <div className="p-4 bg-[var(--admin-surface-light)] rounded-lg"><h3 className="font-semibold mb-3">🇻🇳 Vietnamese</h3><input value={viName} onChange={e => setViName(e.target.value)} className="admin-input mb-2" placeholder="Name" /><input value={viSlug} onChange={e => setViSlug(e.target.value)} className="admin-input" placeholder="Slug" /></div>
                    <div className="p-4 bg-[var(--admin-surface-light)] rounded-lg"><h3 className="font-semibold mb-3">🇬🇧 English</h3><input value={enName} onChange={e => setEnName(e.target.value)} className="admin-input mb-2" placeholder="Name" /><input value={enSlug} onChange={e => setEnSlug(e.target.value)} className="admin-input" placeholder="Slug" /></div>
                </div>
                <div className="admin-modal-footer">
                    <button onClick={onClose} className="admin-btn admin-btn-secondary">Cancel</button>
                    {tag && <button onClick={() => { onDelete(tag.id); onClose(); }} className="admin-btn admin-btn-danger">Delete</button>}
                    <button onClick={handleSubmit} disabled={saving} className="admin-btn admin-btn-primary">{saving ? 'Saving...' : tag ? 'Update' : 'Create'}</button>
                </div>
            </div>
        </div>
    );
}
