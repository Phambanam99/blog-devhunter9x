'use client';

import { useEffect, useMemo, useState } from 'react';

type TocItem = {
    id: string;
    title: string;
    level: number;
};

function slugify(text: string) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\u00C0-\u024f\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export function ReadingProgress({
    targetSelector = '#post-content',
    offset = 0,
    onTocReady,
}: {
    targetSelector?: string;
    offset?: number;
    onTocReady?: (items: TocItem[]) => void;
}) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const doc = document.documentElement;
            const scrollTop = window.scrollY;
            const winHeight = window.innerHeight;
            // Total scrollable height matching the viewport
            const docHeight = doc.scrollHeight;

            // We want 0% when scrollTop <= offset
            // We want 100% when scrollTop + winHeight >= docHeight

            const totalScroll = docHeight - winHeight - offset;
            const currentScroll = scrollTop - offset;

            const pct = totalScroll > 0
                ? Math.min(100, Math.max(0, (currentScroll / totalScroll) * 100))
                : 0;

            setProgress(pct);
        };

        const handleResize = () => handleScroll();

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize);
        handleScroll();
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, [offset]);

    // Build TOC if requested
    useEffect(() => {
        if (!onTocReady) return;
        const container = document.querySelector(targetSelector);
        if (!container) return;

        const headings = Array.from(container.querySelectorAll('h1, h2, h3')) as HTMLElement[];
        const items: TocItem[] = headings.map((el, index) => {
            const id = el.id || slugify(el.textContent || '') || `section-${index}`;
            el.id = id;
            return { id, title: el.textContent || `Section ${index + 1}`, level: Number(el.tagName.slice(1)) };
        });
        onTocReady(items);
    }, [onTocReady, targetSelector]);

    const widthStyle = useMemo(() => ({ width: `${progress}%` }), [progress]);

    return (
        <div className="fixed top-16 left-0 right-0 z-[60] h-1 bg-[var(--color-border)]/30 backdrop-blur-sm">
            <div className="h-full bg-[var(--color-primary)] transition-[width] duration-150 ease-out" style={widthStyle} />
        </div>
    );
}

export function ReadingToc({
    title,
    targetSelector = '#post-content',
}: {
    title: string;
    targetSelector?: string;
}) {
    const [items, setItems] = useState<TocItem[]>([]);

    const handleClick = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    useEffect(() => {
        const container = document.querySelector(targetSelector);
        if (!container) return;

        const buildToc = () => {
            const headings = Array.from(container.querySelectorAll('h1, h2, h3')) as HTMLElement[];
            const mapped = headings.map((el, index) => {
                const id = el.id || slugify(el.textContent || '') || `section-${index}`;
                el.id = id;
                return { id, title: el.textContent || `Section ${index + 1}`, level: Number(el.tagName.slice(1)) };
            });
            setItems(mapped);
        };

        buildToc();
        window.addEventListener('resize', buildToc);
        return () => window.removeEventListener('resize', buildToc);
    }, [targetSelector]);

    if (items.length === 0) return null;

    return (
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24 max-h-[calc(100vh-140px)] overflow-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="text-sm font-semibold text-[var(--color-text)]">{title}</div>
            <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                {items.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleClick(item.id)}
                        className="block w-full text-left hover:text-[var(--color-primary)] transition-colors"
                        style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                    >
                        {item.title}
                    </button>
                ))}
            </div>
        </aside>
    );
}

// Collapsible TOC - shows as collapsible section on all devices
export function CollapsibleToc({
    title,
    targetSelector = '#post-content',
}: {
    title: string;
    targetSelector?: string;
}) {
    const [items, setItems] = useState<TocItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const handleClick = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setIsOpen(false);
    };

    useEffect(() => {
        const container = document.querySelector(targetSelector);
        if (!container) return;

        const buildToc = () => {
            const headings = Array.from(container.querySelectorAll('h1, h2, h3')) as HTMLElement[];
            const mapped = headings.map((el, index) => {
                const id = el.id || slugify(el.textContent || '') || `section-${index}`;
                el.id = id;
                return { id, title: el.textContent || `Section ${index + 1}`, level: Number(el.tagName.slice(1)) };
            });
            setItems(mapped);
        };

        // Delay to ensure content is rendered
        setTimeout(buildToc, 100);
        window.addEventListener('resize', buildToc);
        return () => window.removeEventListener('resize', buildToc);
    }, [targetSelector]);

    if (items.length === 0) return null;

    return (
        <div className="mb-6 bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-sm font-semibold text-[var(--color-text)]"
            >
                <span>📑 {title}</span>
                <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && (
                <div className="px-4 pb-4 space-y-2 text-sm text-[var(--color-text-secondary)] border-t border-[var(--color-border)] pt-3">
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleClick(item.id)}
                            className="block w-full text-left hover:text-[var(--color-primary)] transition-colors py-1"
                            style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                        >
                            {item.title}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
