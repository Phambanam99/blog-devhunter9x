'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { type Locale } from '@/i18n';

interface FooterProps {
    locale: Locale;
}

export default function Footer({ locale }: FooterProps) {
    const t = useTranslations('common');
    const currentYear = new Date().getFullYear();

    const navLinks = [
        { href: `/${locale}`, label: t('home') },
        { href: `/${locale}/blog`, label: t('blog') },
        { href: `/${locale}/about`, label: t('about') },
    ];

    const seoLinks = [
        { href: '/sitemap.xml', label: 'Sitemap' },
        { href: `/api/rss/${locale}.xml`, label: 'RSS Feed' },
    ];

    return (
        <footer className="py-12 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
            <div className="container max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* Brand */}
                    <div>
                        <Link href={`/${locale}`} className="text-xl font-bold text-[var(--color-text)]">
                            DevHunter9x
                        </Link>
                        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                            {locale === 'vi'
                                ? 'Chia sẻ kiến thức lập trình và công nghệ'
                                : 'Sharing programming knowledge and technology'}
                        </p>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h3 className="font-semibold text-[var(--color-text)] mb-3">
                            {locale === 'vi' ? 'Điều hướng' : 'Navigation'}
                        </h3>
                        <ul className="space-y-2">
                            {navLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* SEO & Contact */}
                    <div>
                        <h3 className="font-semibold text-[var(--color-text)] mb-3">
                            {locale === 'vi' ? 'Liên kết' : 'Links'}
                        </h3>
                        <ul className="space-y-2">
                            {seoLinks.map((link) => (
                                <li key={link.href}>
                                    <a
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                            <li>
                                <a
                                    href="mailto:admin@devhunter9x.qzz.io"
                                    className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                                >
                                    Email
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="pt-8 border-t border-[var(--color-border)] text-center text-sm text-[var(--color-text-muted)]">
                    © {currentYear} DevHunter9x. {locale === 'vi' ? 'Bảo lưu mọi quyền.' : 'All rights reserved.'}
                </div>
            </div>
        </footer>
    );
}
