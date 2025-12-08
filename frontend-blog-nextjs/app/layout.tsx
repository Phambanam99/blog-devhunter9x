import type { Metadata } from 'next';

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

export const metadata: Metadata = {
    title: 'Blog Devhunter9x',
    description: 'A Devhunter9x blog platform',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
                {children}
            </body>
        </html>
    );
}
