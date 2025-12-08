'use client';

interface MetaPreviewProps {
    title: string;
    description: string;
    url: string;
    image?: string;
}

export function MetaPreview({ title, description, url, image }: MetaPreviewProps) {
    const truncatedTitle = title.length > 60 ? title.slice(0, 57) + '...' : title;
    const truncatedDesc = description.length > 160 ? description.slice(0, 157) + '...' : description;

    return (
        <div className="space-y-4">
            {/* Google Preview */}
            <div>
                <h4 className="text-xs font-medium text-[var(--admin-text-muted)] uppercase mb-2">Google Preview</h4>
                <div className="p-4 bg-white rounded-lg text-black">
                    <div className="text-xs text-green-700 mb-1">{url}</div>
                    <div className="text-blue-800 text-lg hover:underline cursor-pointer mb-1">{truncatedTitle || 'Page Title'}</div>
                    <div className="text-sm text-gray-600 line-clamp-2">{truncatedDesc || 'Page description will appear here...'}</div>
                </div>
            </div>

            {/* Facebook/OG Preview */}
            <div>
                <h4 className="text-xs font-medium text-[var(--admin-text-muted)] uppercase mb-2">Facebook Preview</h4>
                <div className="bg-[#f0f2f5] rounded-lg overflow-hidden max-w-md">
                    {image ? (
                        <div className="aspect-[1.91/1] bg-gray-200">
                            <img src={image} alt="OG Preview" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="aspect-[1.91/1] bg-gray-300 flex items-center justify-center text-gray-500">
                            No image
                        </div>
                    )}
                    <div className="p-3 bg-[#e4e6eb]">
                        <div className="text-[10px] text-gray-500 uppercase">{new URL(url || 'http://localhost').hostname}</div>
                        <div className="font-semibold text-black text-sm line-clamp-2">{truncatedTitle || 'Page Title'}</div>
                        <div className="text-xs text-gray-500 line-clamp-1">{truncatedDesc}</div>
                    </div>
                </div>
            </div>

            {/* Twitter Preview */}
            <div>
                <h4 className="text-xs font-medium text-[var(--admin-text-muted)] uppercase mb-2">Twitter Preview</h4>
                <div className="bg-white rounded-xl overflow-hidden max-w-md border border-gray-200">
                    {image ? (
                        <div className="aspect-[2/1] bg-gray-200">
                            <img src={image} alt="Twitter Preview" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="aspect-[2/1] bg-gray-300 flex items-center justify-center text-gray-500">
                            No image
                        </div>
                    )}
                    <div className="p-3">
                        <div className="font-semibold text-black text-sm line-clamp-2">{truncatedTitle || 'Page Title'}</div>
                        <div className="text-xs text-gray-500 line-clamp-2 mt-1">{truncatedDesc}</div>
                        <div className="text-xs text-gray-400 mt-1">{new URL(url || 'http://localhost').hostname}</div>
                    </div>
                </div>
            </div>

            {/* Character counts */}
            <div className="text-xs text-[var(--admin-text-muted)] space-y-1">
                <div className={title.length > 60 ? 'text-[var(--admin-warning)]' : ''}>
                    Title: {title.length}/60 characters {title.length > 60 && '⚠️ Too long'}
                </div>
                <div className={description.length > 160 ? 'text-[var(--admin-warning)]' : ''}>
                    Description: {description.length}/160 characters {description.length > 160 && '⚠️ Too long'}
                </div>
            </div>
        </div>
    );
}
