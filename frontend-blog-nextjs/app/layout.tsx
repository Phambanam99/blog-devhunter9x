import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

// Self-hosted Inter font with Vietnamese subset for faster loading
const inter = Inter({
    subsets: ['latin', 'vietnamese'],
    display: 'swap',
    variable: '--font-sans',
    preload: true,
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://devhunter9x.com';

const themeScript = `
(() => {
  const storageKey = 'theme';
  try {
    const stored = window.localStorage.getItem(storageKey);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light');
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
  } catch (_) {
    // Ignore errors (e.g. access blocked)
  }
})();
`;

// WebSite schema for sitelinks search box
const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Blog Devhunter9x',
    url: SITE_URL,
    potentialAction: {
        '@type': 'SearchAction',
        target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/vi/blog?search={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
    }
};

// Organization schema
const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Devhunter9x',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: []
};

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: 'Blog Devhunter9x - Chia sẻ kiến thức lập trình',
        template: '%s | Blog Devhunter9x',
    },
    description: 'Blog chia sẻ kiến thức về lập trình, công nghệ, và cuộc sống từ Devhunter9x',
    keywords: ['blog', 'lập trình', 'programming', 'tech', 'devhunter9x', 'công nghệ', 'technology'],
    authors: [{ name: 'Devhunter9x' }],
    creator: 'Devhunter9x',
    publisher: 'Devhunter9x',
    formatDetection: {
        email: false,
        telephone: false,
    },
    verification: {
        google: 'google12fc1637dffd91d0',
    },
    openGraph: {
        title: 'Blog Devhunter9x - Chia sẻ kiến thức lập trình',
        description: 'Blog chia sẻ kiến thức về lập trình, công nghệ, và cuộc sống từ Devhunter9x',
        siteName: 'Blog Devhunter9x',
        locale: 'vi_VN',
        type: 'website',
        url: SITE_URL,
        images: [
            {
                url: `${SITE_URL}/og-image.png`,
                width: 1200,
                height: 630,
                alt: 'Blog Devhunter9x',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        creator: '@devhunter9x',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    icons: {
        icon: '/favicon.ico',
    },
    manifest: '/manifest.json',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* Critical: Viewport meta for mobile */}
                <meta name="viewport" content="width=device-width, initial-scale=1" />

                {/* Preconnect to external resources for faster loading */}
                <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />

                {/* Font Awesome - load only solid icons (used in admin), defer loading */}
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/fontawesome.min.css"
                    crossOrigin="anonymous"
                    media="print"
                    // @ts-ignore
                    onLoad="this.media='all'"
                />
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/solid.min.css"
                    crossOrigin="anonymous"
                    media="print"
                    // @ts-ignore
                    onLoad="this.media='all'"
                />
                <noscript>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/fontawesome.min.css" />
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/solid.min.css" />
                </noscript>

                {/* JSON-LD Structured Data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
                />
            </head>
            <body className={inter.variable} suppressHydrationWarning>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
                {children}
            </body>
        </html>
    );
}

