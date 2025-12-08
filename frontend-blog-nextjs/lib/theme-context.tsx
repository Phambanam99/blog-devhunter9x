'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    mounted: boolean;
}

const STORAGE_KEY = 'theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getPreferredTheme(): Theme {
    if (typeof window === 'undefined') return 'light';

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
}

function applyThemeToDocument(theme: Theme) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => getPreferredTheme());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        applyThemeToDocument(theme);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_KEY, theme);
        }
    }, [theme]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const setTheme = useCallback((next: Theme) => {
        setThemeState(next);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    const value = useMemo(
        () => ({
            theme,
            toggleTheme,
            setTheme,
            mounted,
        }),
        [theme, toggleTheme, setTheme, mounted]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

