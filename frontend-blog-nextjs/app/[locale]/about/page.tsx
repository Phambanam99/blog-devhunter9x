'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { type Locale } from '@/i18n';

type Bilingual = { vi: string; en: string };

const profileImage = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=640&q=80';

const experiences: Array<{
    company: string;
    role: Bilingual;
    period: Bilingual;
    achievements: Bilingual[];
}> = [
    {
        company: 'Freelance & Blog Studio',
        role: { vi: 'Kỹ sư phần mềm / Tác giả blog', en: 'Software Engineer / Blogger' },
        period: { vi: '2018 - Hiện tại', en: '2018 - Present' },
        achievements: [
            {
                vi: 'Xây dựng hệ thống blog song ngữ với Next.js, NestJS, Prisma và PostgreSQL.',
                en: 'Built a bilingual blog system using Next.js, NestJS, Prisma, and PostgreSQL.',
            },
            {
                vi: 'Thiết kế trải nghiệm người dùng tối ưu cho SEO, tốc độ và khả năng truy cập.',
                en: 'Designed user experiences optimized for SEO, performance, and accessibility.',
            },
            {
                vi: 'Viết và biên tập nội dung kỹ thuật, tập trung vào thực tiễn triển khai.',
                en: 'Authored and edited technical articles focused on practical implementation.',
            },
        ],
    },
    {
        company: 'Product & Platform Teams',
        role: { vi: 'Tech Lead / Full-stack Engineer', en: 'Tech Lead / Full-stack Engineer' },
        period: { vi: '2014 - 2018', en: '2014 - 2018' },
        achievements: [
            {
                vi: 'Dẫn dắt nhóm 6 người xây dựng dịch vụ API phục vụ >1 triệu request/ngày.',
                en: 'Led a 6-person team building APIs serving 1M+ requests/day.',
            },
            {
                vi: 'Thiết lập CI/CD, logging và giám sát giúp giảm 40% thời gian khắc phục sự cố.',
                en: 'Set up CI/CD, logging, and monitoring, cutting incident resolution time by 40%.',
            },
            {
                vi: 'Huấn luyện thành viên mới về codebase, kiến trúc và best practices.',
                en: 'Coached new teammates on codebase, architecture, and best practices.',
            },
        ],
    },
];

const skills = {
    tech: ['TypeScript', 'Node.js', 'NestJS', 'React', 'Next.js', 'Prisma', 'PostgreSQL', 'Redis'],
    tooling: ['Git & CI/CD', 'Docker', 'RESTful APIs', 'GraphQL basics', 'Testing', 'Performance tuning'],
    soft: ['Mentoring', 'Product thinking', 'Technical writing', 'Problem solving', 'Communication'],
};

const projects: Array<{
    title: Bilingual;
    description: Bilingual;
    stack: string[];
}> = [
    {
        title: { vi: 'Blog song ngữ', en: 'Bilingual blog' },
        description: {
            vi: 'Nền tảng blog đa ngôn ngữ với chế độ tối, tối ưu SEO và trải nghiệm đọc mượt.',
            en: 'Multilingual blog platform with dark mode, SEO-friendly structure, and smooth reading UX.',
        },
        stack: ['Next.js', 'Next-Intl', 'Tailwind', 'ISR/Revalidation'],
    },
    {
        title: { vi: 'CMS nhẹ cho tác giả', en: 'Lightweight author CMS' },
        description: {
            vi: 'Dashboard quản trị bài viết, media và phân quyền, đồng bộ với API NestJS.',
            en: 'Admin dashboard for posts, media, and permissions, synced with NestJS APIs.',
        },
        stack: ['NestJS', 'Prisma', 'PostgreSQL', 'Cloud Storage'],
    },
];

export default function AboutPage() {
    const params = useParams();
    const locale = (params.locale as Locale) || 'vi';
    const tCommon = useTranslations('common');
    const otherLocale = locale === 'vi' ? 'en' : 'vi';
    const lang: 'vi' | 'en' = locale === 'vi' ? 'vi' : 'en';

    const headline = lang === 'vi' ? 'Về tôi' : 'About me';
    const subtitle = lang === 'vi'
        ? 'Tác giả blog, kỹ sư phần mềm và người kể chuyện về sản phẩm số.'
        : 'Blog author, software engineer, and storyteller about digital products.';
    const summary = lang === 'vi'
        ? 'Mình là Nam, thích biến ý tưởng thành sản phẩm có ích. Mình tập trung vào hiệu năng, độ tin cậy và trải nghiệm người dùng, đồng thời yêu việc chia sẻ kiến thức qua bài viết và workshop.'
        : 'I am Nam, focused on shipping useful products with performance, reliability, and thoughtful UX. I love sharing knowledge through writing and workshops.';

    const quickFacts = [
        { label: lang === 'vi' ? 'Chức danh' : 'Role', value: lang === 'vi' ? 'Software Engineer / Blogger' : 'Software Engineer / Blogger' },
        { label: lang === 'vi' ? 'Kinh nghiệm' : 'Experience', value: '8+ years' },
        { label: lang === 'vi' ? 'Địa điểm' : 'Based in', value: 'Hà Nội, Việt Nam' },
        { label: 'Email', value: 'phamnam.dev@gmail.com', href: 'mailto:phamnam.dev@gmail.com' },
    ];

    return (
        <div className="min-h-screen">
            <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/95 border-b border-[var(--color-border)] backdrop-blur-sm shadow-sm">
                <div className="container">
                    <nav className="flex items-center justify-between h-16">
                        <Link href={`/${locale}`} className="text-xl font-semibold text-[var(--color-text)]">Blog</Link>
                        <div className="hidden md:flex items-center gap-8">
                            <Link href={`/${locale}`} className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">{tCommon('home')}</Link>
                            <Link href={`/${locale}/blog`} className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">{tCommon('blog')}</Link>
                            <Link href={`/${locale}/about`} className="text-sm font-medium text-[var(--color-primary)]">{tCommon('about')}</Link>
                        </div>
                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <Link
                                href={`/${otherLocale}/about`}
                                className="text-sm font-medium px-3 py-1.5 rounded-full border border-[var(--color-border)] hover:border-[var(--color-primary)]"
                            >
                                {tCommon('switchLanguage')}
                            </Link>
                        </div>
                    </nav>
                </div>
            </header>

            <main className="pt-24 pb-16">
                <div className="container max-w-5xl space-y-12">
                    <section className="grid md:grid-cols-[1fr,1.2fr] gap-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 shadow-sm">
                        <div className="flex flex-col sm:flex-row md:flex-col gap-6 items-center md:items-start">
                            <div className="relative">
                                <div className="w-36 h-36 rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-md">
                                    <img src={profileImage} alt={lang === 'vi' ? 'Ảnh thẻ tác giả' : 'Author portrait'} className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[var(--color-primary)] text-white text-sm shadow-md">
                                    8+ yrs
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-secondary)]">
                                <span className="px-3 py-1 bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-full">TypeScript</span>
                                <span className="px-3 py-1 bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-full">Full-stack</span>
                                <span className="px-3 py-1 bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-full">UX-first</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm uppercase tracking-wide text-[var(--color-text-muted)]">{headline}</p>
                                <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mt-1">Pham Nam</h1>
                                <p className="text-lg text-[var(--color-text-secondary)] mt-2">{subtitle}</p>
                            </div>
                            <p className="text-[var(--color-text-secondary)] leading-relaxed">{summary}</p>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {quickFacts.map((item, idx) => (
                                    <a
                                        key={idx}
                                        href={item.href || undefined}
                                        className="block bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-primary)] transition-colors"
                                    >
                                        <div className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">{item.label}</div>
                                        <div className="text-sm font-semibold text-[var(--color-text)] mt-1">{item.value}</div>
                                    </a>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <a href="mailto:phamnam.dev@gmail.com" className="btn btn-primary">
                                    {lang === 'vi' ? 'Liên hệ' : 'Get in touch'}
                                </a>
                                <Link href={`/${locale}/blog`} className="btn btn-secondary">
                                    {lang === 'vi' ? 'Xem bài viết' : 'View blog'}
                                </Link>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-[var(--color-text)]">{lang === 'vi' ? 'Kinh nghiệm tiêu biểu' : 'Highlighted experience'}</h2>
                            <span className="text-sm text-[var(--color-text-muted)]">{lang === 'vi' ? 'Tập trung vào sản phẩm & platform' : 'Product & platform focus'}</span>
                        </div>
                        <div className="space-y-4">
                            {experiences.map((exp, idx) => (
                                <div key={idx} className="relative p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <div>
                                            <div className="text-sm text-[var(--color-text-muted)]">{exp.company}</div>
                                            <div className="text-lg font-semibold text-[var(--color-text)]">{exp.role[lang]}</div>
                                        </div>
                                        <span className="text-sm px-3 py-1 rounded-full bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                                            {exp.period[lang]}
                                        </span>
                                    </div>
                                    <ul className="mt-4 space-y-2 text-[var(--color-text-secondary)]">
                                        {exp.achievements.map((item, i) => (
                                            <li key={i} className="flex gap-2">
                                                <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-primary)] flex-shrink-0" />
                                                <span>{item[lang]}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm space-y-4">
                            <h2 className="text-xl font-bold text-[var(--color-text)]">{lang === 'vi' ? 'Kỹ năng & công cụ' : 'Skills & tools'}</h2>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <div className="text-[var(--color-text-muted)] mb-1">{lang === 'vi' ? 'Công nghệ chính' : 'Core tech'}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.tech.map(skill => (
                                            <span key={skill} className="px-3 py-1 rounded-full bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-text)]">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[var(--color-text-muted)] mb-1">{lang === 'vi' ? 'Công cụ & quy trình' : 'Tooling & process'}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.tooling.map(skill => (
                                            <span key={skill} className="px-3 py-1 rounded-full bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-text)]">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[var(--color-text-muted)] mb-1">{lang === 'vi' ? 'Kỹ năng mềm' : 'Soft skills'}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.soft.map(skill => (
                                            <span key={skill} className="px-3 py-1 rounded-full bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-text)]">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm space-y-4">
                            <h2 className="text-xl font-bold text-[var(--color-text)]">{lang === 'vi' ? 'Dự án & nổi bật' : 'Projects & highlights'}</h2>
                            <div className="space-y-4">
                                {projects.map((project, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-border)]">
                                        <div className="text-lg font-semibold text-[var(--color-text)]">{project.title[lang]}</div>
                                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">{project.description[lang]}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {project.stack.map(tag => (
                                                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="p-6 md:p-8 bg-[var(--gradient-primary)] text-white rounded-3xl shadow-md">
                        <div className="md:flex md:items-center md:justify-between gap-4">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold">{lang === 'vi' ? 'Cùng xây dựng điều mới mẻ' : 'Let’s build something new'}</h3>
                                <p className="text-white/80">
                                    {lang === 'vi'
                                        ? 'Mình sẵn sàng hợp tác cho các dự án sản phẩm số, viết nội dung kỹ thuật hoặc cố vấn đội ngũ.'
                                        : 'Open to collaborations on digital products, technical writing, or team coaching.'}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
                                <a href="mailto:phamnam.dev@gmail.com" className="btn btn-secondary bg-white text-[var(--color-primary)] hover:transform-none">
                                    {lang === 'vi' ? 'Gửi email' : 'Email me'}
                                </a>
                                <Link href={`/${locale}/blog`} className="btn btn-secondary border-white text-white hover:transform-none hover:bg-white/10">
                                    {lang === 'vi' ? 'Xem thêm bài viết' : 'Browse more posts'}
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <footer className="py-8 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
                <div className="container text-center text-[var(--color-text-muted)]">{tCommon('footer.copyright')}</div>
            </footer>
        </div>
    );
}

