'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminMedia, uploadMedia, deleteMedia } from '@/lib/admin-api';
import AdminSidebar from '../components/AdminSidebar';

interface MediaItem {
    id: string;
    filename: string;
    mimeType: string;
    url: string;
    thumbnailUrl?: string | null;
    alt?: string | null;
    caption?: string | null;
    size: number;
    width?: number;
    height?: number;
    createdAt: string;
}

export default function MediaPage() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [altText, setAltText] = useState('');
    const [caption, setCaption] = useState('');

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/admin/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchMedia();
        }
    }, [isAuthenticated]);

    async function fetchMedia() {
        setLoading(true);
        try {
            const res = await getAdminMedia({ limit: 100 });
            setMediaItems(Array.isArray(res) ? res : res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.length) return;
        setUploading(true);
        try {
            await Promise.all(Array.from(e.target.files).map(file => uploadMedia(file, { alt: altText || undefined, caption: caption || undefined })));
            fetchMedia();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setUploading(false);
        }
    }

    async function handleDeleteSelected() {
        if (!confirm(`Delete ${selectedItems.length} items?`)) return;
        try {
            await Promise.all(selectedItems.map(id => deleteMedia(id)));
            setSelectedItems([]);
            fetchMedia();
        } catch (err: any) {
            alert(err.message);
        }
    }

    function formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function buildUrl(raw?: string | null) {
        if (!raw) return '';
        if (raw.startsWith('http')) return raw;
        const base = (process.env.NEXT_PUBLIC_API_URL || '').replace('/api', '');
        return `${base}${raw}`;
    }

    function toggleSelect(id: string) {
        setSelectedItems((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    }

    const filteredMedia = mediaItems.filter((item) =>
        item.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    return (
        <div className="flex">
            <AdminSidebar user={user} onLogout={logout} />

            <main className="admin-main p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">Media Library</h1>
                        <p className="text-[var(--admin-text-muted)]">
                            {mediaItems.length} files • {formatFileSize(mediaItems.reduce((sum, m) => sum + m.size, 0))} total
                        </p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="admin-card mb-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-grow">
                            <div className="relative flex-grow max-w-md">
                                <input
                                    type="text"
                                    placeholder="Search files..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="admin-input pl-10"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]">
                                    🔍
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Tên hiển thị/Alt (tùy chọn)"
                                value={altText}
                                onChange={(e) => setAltText(e.target.value)}
                                className="admin-input max-w-xs"
                            />
                            <input
                                type="text"
                                placeholder="Caption (tùy chọn)"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                className="admin-input max-w-xs"
                            />
                            <input type="file" multiple onChange={handleUpload} className="hidden" id="file-upload" />
                            <label htmlFor="file-upload" className="admin-btn admin-btn-primary cursor-pointer">
                                {uploading ? 'Uploading...' : '📤 Upload'}
                            </label>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[var(--admin-primary)] text-white' : 'text-[var(--admin-text-muted)]'}`}
                            >
                                ▦
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded ${viewMode === 'list' ? 'bg-[var(--admin-primary)] text-white' : 'text-[var(--admin-text-muted)]'}`}
                            >
                                ☰
                            </button>
                        </div>
                    </div>

                    {selectedItems.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[var(--admin-border)] flex items-center gap-4">
                            <span className="text-sm text-[var(--admin-text-muted)]">
                                {selectedItems.length} selected
                            </span>
                            <button onClick={handleDeleteSelected} className="text-sm text-[var(--admin-danger)] hover:underline">
                                Delete selected
                            </button>
                            <button
                                onClick={() => setSelectedItems([])}
                                className="text-sm text-[var(--admin-text-muted)] hover:underline"
                            >
                                Clear selection
                            </button>
                        </div>
                    )}
                </div>

                {loading ? <div className="text-center p-12 animate-pulse">Loading media...</div> : (
                    <>
                        {/* Media Grid/List */}
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filteredMedia.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => toggleSelect(item.id)}
                                        className={`admin-card cursor-pointer transition-all hover:scale-[1.02] ${selectedItems.includes(item.id)
                                            ? 'ring-2 ring-[var(--admin-primary)]'
                                            : ''
                                            }`}
                                    >
                                        <div className="aspect-square relative overflow-hidden rounded-lg mb-3 bg-gray-100 flex items-center justify-center">
                                            {item.mimeType.startsWith('image/') ? (
                                                <img
                                                    src={buildUrl(item.thumbnailUrl) || buildUrl(item.url)}
                                                    alt={item.filename}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-4xl">📄</span>
                                            )}
                                            {selectedItems.includes(item.id) && (
                                                <div className="absolute top-2 right-2 w-6 h-6 bg-[var(--admin-primary)] rounded-full flex items-center justify-center text-white text-xs">
                                                    ✓
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium truncate" title={item.filename}>{item.filename}</p>
                                        <p className="text-xs text-[var(--admin-text-muted)]">
                                            {formatFileSize(item.size)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="admin-card">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th className="w-10">
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedItems(filteredMedia.map((m) => m.id));
                                                        } else {
                                                            setSelectedItems([]);
                                                        }
                                                    }}
                                                />
                                            </th>
                                            <th>Preview</th>
                                            <th>Filename</th>
                                            <th>Type</th>
                                            <th>Size</th>
                                            <th>Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMedia.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.includes(item.id)}
                                                        onChange={() => toggleSelect(item.id)}
                                                    />
                                                </td>
                                                <td>
                                                    {item.mimeType.startsWith('image/') ? (
                                                        <img
                                                            src={item.url}
                                                            alt={item.filename}
                                                            className="w-12 h-12 object-cover rounded"
                                                        />
                                                    ) : (
                                                        <span>📄</span>
                                                    )}
                                                </td>
                                                <td className="font-medium">{item.filename}</td>
                                                <td>
                                                    <span className="admin-badge admin-badge-secondary">
                                                        {item.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                                                    </span>
                                                </td>
                                                <td>{formatFileSize(item.size)}</td>
                                                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* Upload Drop Zone */}
                <div className="mt-8 border-2 border-dashed border-[var(--admin-border)] rounded-xl p-12 text-center relative">
                    <input type="file" multiple onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="text-4xl mb-4">📁</div>
                    <p className="text-lg font-medium mb-2">{uploading ? 'Uploading...' : 'Drop files here or click to upload'}</p>
                    <p className="text-[var(--admin-text-muted)] text-sm mb-4">
                        Supports: Images, Videos, Documents
                    </p>
                    <button className="admin-btn admin-btn-secondary">
                        Browse files
                    </button>
                </div>
            </main>
        </div>
    );
}
