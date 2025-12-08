'use client';

import { useTheme } from '@/lib/theme-context';

export default function ThemeToggle() {
    const { theme, toggleTheme, mounted } = useTheme();
    // Avoid hydration mismatches: render a neutral label/icon until mounted.
    const showTheme = mounted ? theme : 'light';
    const isDark = showTheme === 'dark';

    const icon = mounted ? (isDark ? '☀️' : '🌙') : '🌓';
    const label = mounted ? (isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối') : 'Chuyển giao diện';

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] transition-colors"
            aria-label={label}
            title={label}
        >
            <span aria-hidden className="text-lg leading-none">{icon}</span>
        </button>
    );
}

