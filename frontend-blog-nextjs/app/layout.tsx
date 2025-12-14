import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://blog.devhunter9x.qzz.io';

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
        siteName: 'Blog Devhunter9x',
        locale: 'vi_VN',
        type: 'website',
        url: SITE_URL,
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
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
                    integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                />
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
            <body suppressHydrationWarning>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
                {children}
            </body>
        </html>
    );
}

