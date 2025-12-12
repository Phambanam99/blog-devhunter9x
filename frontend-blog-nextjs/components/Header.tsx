'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { type Locale } from '@/i18n';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
    locale: Locale;
    currentPage?: 'home' | 'blog' | 'about' | 'post';
    /** For blog post pages - alternate language slug */
    altLangHref?: string;
}

export default function Header({ locale, currentPage = 'home', altLangHref }: HeaderProps) {
    const t = useTranslations('common');
    const otherLocale = locale === 'vi' ? 'en' : 'vi';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Determine the alternate language link
    const switchLangHref = altLangHref || `/${otherLocale}`;

    const navItems = [
        { key: 'home', href: `/${locale}`, label: t('home') },
        { key: 'blog', href: `/${locale}/blog`, label: t('blog') },
        { key: 'about', href: `/${locale}/about`, label: t('about') },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/95 border-b border-[var(--color-border)] backdrop-blur-sm shadow-sm">
            <div className="container">
                <nav className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href={`/${locale}`} className="text-xl font-semibold text-[var(--color-text)]">
                        DevHunter9x
                    </Link>

                    {/* Desktop menu */}
                    <div className="hidden md:flex items-center gap-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.key}
                                href={item.href}
                                className={`text-sm font-medium transition-colors ${currentPage === item.key
                                    ? 'text-[var(--color-primary)]'
                                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />

                        {/* Language switch */}
                        <Link
                            href={switchLangHref}
                            className="text-sm font-medium px-3 py-1.5 rounded-full border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                        >
                            <span className="hidden sm:inline">{t('switchLanguage')}</span>
                            <span className="sm:hidden">{locale === 'vi' ? 'EN' : 'VI'}</span>
                        </Link>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-[var(--color-surface-light)] transition-colors"
                            aria-label="Toggle menu"
                        >
                            <svg
                                className="w-6 h-6 text-[var(--color-text)]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </nav>

                {/* Mobile dropdown menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-[var(--color-border)] animate-fadeIn">
                        <div className="flex flex-col gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentPage === item.key || (currentPage === 'post' && item.key === 'blog')
                                            ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-l-4 border-[var(--color-primary)]'
                                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-light)] hover:text-[var(--color-primary)]'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
