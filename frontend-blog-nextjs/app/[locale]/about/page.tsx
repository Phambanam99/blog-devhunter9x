'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
            company: 'TT CNTT',
            role: { vi: 'Kỹ sư phần mềm / Tác giả blog', en: 'Software Engineer / Blogger' },
            period: { vi: '2023 - Hiện tại', en: '2023 - Present' },
            achievements: [
                {
                    vi: 'Xây dựng các phần mềm trong các cơ quan nhà nước phục vụ chuyển đổi số.',
                    en: 'Built software for government agencies to serve digital transformation.',
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
        }
    ];

const skills = {
    tech: ['TypeScript', 'Node.js', 'NestJS', 'React', 'Next.js', 'Prisma', 'PostgreSQL', 'Redis', 'Java', 'Spring Boot'],
    tooling: ['Git & CI/CD', 'Docker', 'RESTful APIs', 'GraphQL basics', 'Testing', 'Performance tuning'],
    soft: ['Mentoring', 'Product thinking', 'Technical writing', 'Problem solving', 'Communication'],
};

const projects: Array<{
    title: Bilingual;
    description: Bilingual;
    stack: string[];
}> = [
        {
            title: { vi: 'Blog devhunter9x', en: 'Devhunter9x blog' },
            description: {
                vi: 'Nền tảng blog đa ngôn ngữ với chế độ tối, tối ưu SEO và trải nghiệm đọc mượt.',
                en: 'Multilingual blog platform with dark mode, SEO-friendly structure, and smooth reading UX.',
            },
            stack: ['Next.js', 'Next-Intl', 'Tailwind', 'ISR/Revalidation'],
        },
        {
            title: { vi: 'Phần mềm quản lý công văn', en: 'Document management software' },
            description: {
                vi: 'Dashboard quản lý công văn, media và phân quyền, đồng bộ với API springboot.',
                en: 'Admin dashboard for posts, media, and permissions, synced with Springboot APIs.',
            },
            stack: ['Springboot', 'Websocket', 'PostgreSQL', 'Redis', 'Docker', "Reactjs"],
        },
        {
            title: { vi: 'Phần mềm quản lý vũ khí trang bị', en: 'Weapon management software' },
            description: {
                vi: 'Dashboard quản lý vũ khí trang bị, media và phân quyền, đồng bộ với API springboot.',
                en: 'Admin dashboard for posts, media, and permissions, synced with Springboot APIs.',
            },
            stack: ['Springboot', 'Websocket', 'PostgreSQL', 'Redis', 'Docker', "Nextjs", "Tailwind", "TypeScript", "Prisma"],
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
        ? 'Tác giả blog, kỹ sư phần mềm.'
        : 'Blog author, software engineer';
    const summary = lang === 'vi'
        ? 'Mình là Nam, thích biến ý tưởng thành sản phẩm có ích. Mình tập trung vào hiệu năng, độ tin cậy và trải nghiệm người dùng, đồng thời yêu việc chia sẻ kiến thức qua bài viết và workshop. Là người năng động, luôn học hỏi từng ngày.... Mình nhận mọi dự án làm web, app, thiết kế UI/UX, liên hệ ngay qua email: admin@devhunter9x.qzz.io'
        : 'I am Nam, focused on shipping useful products with performance, reliability, and thoughtful UX. I love sharing knowledge through writing and workshops. I am always learning and growing every day... I receive every project to make web, app, UI/UX design, contact me via email: admin@devhunter9x.qzz.io';

    const quickFacts = [
        { label: lang === 'vi' ? 'Chức danh' : 'Role', value: lang === 'vi' ? 'Software Engineer / Blogger' : 'Software Engineer / Blogger' },
        { label: lang === 'vi' ? 'Kinh nghiệm' : 'Experience', value: '3+ years' },
        { label: lang === 'vi' ? 'Địa điểm' : 'Based in', value: 'Hà Nội, Việt Nam' },
        { label: 'Email', value: 'admin@devhunter9x.qzz.io', href: 'mailto:admin@devhunter9x.qzz.io' },
    ];

    return (
        <div className="min-h-screen">
            <Header locale={locale} currentPage="about" altLangHref={`/${otherLocale}/about`} />

            <main className="pt-24 pb-16">
                <div className="container max-w-5xl space-y-12">
                    <section className="grid md:grid-cols-[1fr,1.2fr] gap-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 shadow-sm">
                        <div className="flex flex-col sm:flex-row md:flex-col gap-6 items-center md:items-start">
                            <div className="relative">
                                <div className="w-36 h-36 rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-md">
                                    <img src={profileImage} alt={lang === 'vi' ? 'Ảnh thẻ tác giả' : 'Author portrait'} className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[var(--color-primary)] text-white text-sm shadow-md">
                                    3+ yrs
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-secondary)]">
                                <span className="px-3 py-1 bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-full">TypeScript</span>
                                <span className="px-3 py-1 bg-[var(--color-surface-light)] border border-[var(--color-border)] rounded-full">Backend Java</span>
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
                                <a href="mailto:admin@devhunter9x.qzz.io" className="btn btn-primary">
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
                            <h2 className="text-2xl font-bold text-[var(--color-text)]">{lang === 'vi' ? 'Kinh nghiệm' : 'Experience'}</h2>
                            <span className="text-sm text-[var(--color-text-muted)]">{lang === 'vi' ? 'Sản phẩm & platform' : 'Product & platform'}</span>
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

                    <section className="p-6 md:p-8 rounded-3xl shadow-md text-white" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)' }}>
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
                                <a href="mailto:admin@devhunter9x.qzz.io" className="btn btn-secondary bg-white text-[var(--color-primary)] hover:transform-none">
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

            <Footer locale={locale} />
        </div>
    );
}

