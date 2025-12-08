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
        <aside className="sticky top-24 max-h-[calc(100vh-140px)] overflow-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm space-y-3">
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

