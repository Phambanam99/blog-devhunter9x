import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n';
import { ThemeProvider } from '@/lib/theme-context';
import './globals.css';

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    // Validate that the incoming locale is valid
    if (!locales.includes(locale as Locale)) {
        notFound();
    }

    // Enable static rendering
    setRequestLocale(locale);

    const messages = await getMessages();

    return (
        <ThemeProvider>
            <NextIntlClientProvider messages={messages}>
                {children}
            </NextIntlClientProvider>
        </ThemeProvider>
    );
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    const titles = {
        vi: 'Blog dev hunter9x',
        en: 'Devhunter9x Blog',
    };

    const descriptions = {
        vi: 'Blog devhunter9x về công nghệ, lập trình và cuộc sống',
        en: 'Devhunter9x Blog about technology, programming, and lifestyle',
    };

    return {
        title: {
            default: titles[locale as Locale] || titles.vi,
            template: `%s | ${titles[locale as Locale] || titles.vi}`,
        },
        description: descriptions[locale as Locale] || descriptions.vi,
        alternates: {
            canonical: `/${locale}`,
            languages: {
                vi: '/vi',
                en: '/en',
            },
        },
    };
}
