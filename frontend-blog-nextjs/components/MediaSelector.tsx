'use client';

import { useState, useEffect } from 'react';
import { getAdminMedia, uploadMedia } from '@/lib/admin-api';

export interface MediaItem {
    id: string;
    filename: string;
    mimeType: string;
    url: string;
    thumbnailUrl?: string | null;
    size: number;
    width?: number;
    height?: number;
    alt?: string;
    caption?: string;
    createdAt: string;
}

interface MediaSelectorProps {
    onSelect: (media: MediaItem) => void;
    onCancel: () => void;
}

export function MediaSelector({ onSelect, onCancel }: MediaSelectorProps) {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [altText, setAltText] = useState('');
    const [caption, setCaption] = useState('');

    useEffect(() => {
        fetchMedia();
    }, []);

    async function fetchMedia() {
        setLoading(true);
        try {
            const res = await getAdminMedia({ limit: 50 });
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
            await fetchMedia();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setUploading(false);
        }
    }

    function formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    const filteredMedia = mediaItems.filter((item) =>
        item.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const buildUrl = (raw?: string | null) => {
        if (!raw) return '';
        if (raw.startsWith('http')) return raw;
        const base = (process.env.NEXT_PUBLIC_API_URL || '').replace('/api', '');
        return `${base}${raw}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold">Select Media</h2>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 flex gap-4 border-b border-gray-100">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            🔍
                        </span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-shrink-0">
                        <input
                            type="text"
                            placeholder="Tên hiển thị/Alt"
                            value={altText}
                            onChange={(e) => setAltText(e.target.value)}
                            className="w-full sm:w-40 px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                        />
                        <input
                            type="text"
                            placeholder="Caption"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="w-full sm:w-40 px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                        />
                        <div className="flex-shrink-0">
                            <input type="file" multiple onChange={handleUpload} className="hidden" id="modal-file-upload" />
                            <label
                                htmlFor="modal-file-upload"
                                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${uploading
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                {uploading ? 'Uploading...' : '📤 Upload New'}
                            </label>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredMedia.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => onSelect(item)}
                                    className="group relative bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all overflow-hidden"
                                >
                                    <div className="aspect-square relative bg-gray-100 flex items-center justify-center">
                                        {item.mimeType.startsWith('image/') ? (
                                            <img
                                                src={buildUrl(item.thumbnailUrl) || buildUrl(item.url)}
                                                alt={item.filename}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <span className="text-4xl">📄</span>
                                        )}
                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    </div>
                                    <div className="p-2">
                                        <p className="text-xs font-medium truncate text-gray-700" title={item.filename}>
                                            {item.filename}
                                        </p>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-[10px] text-gray-400">
                                                {formatFileSize(item.size)}
                                            </p>
                                            <span className="text-[10px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                Select
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredMedia.length === 0 && (
                                <div className="col-span-full text-center py-12 text-gray-400">
                                    <p>No media files found</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
