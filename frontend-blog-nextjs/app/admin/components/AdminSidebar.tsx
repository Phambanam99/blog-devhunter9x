'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'EDITOR' | 'AUTHOR';
}

interface AdminSidebarProps {
    user: AdminUser | null;
    onLogout: () => void;
}

interface MenuItem {
    label: string;
    href: string;
    icon: string; // Font Awesome class
    adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: 'fa-solid fa-chart-line' },
    { label: 'Posts', href: '/admin/posts', icon: 'fa-solid fa-file-lines' },
    { label: 'Media', href: '/admin/media', icon: 'fa-solid fa-images' },
    { label: 'Categories', href: '/admin/categories', icon: 'fa-solid fa-folder-tree' },
    { label: 'Tags', href: '/admin/tags', icon: 'fa-solid fa-tags' },
    { label: 'Users', href: '/admin/users', icon: 'fa-solid fa-users', adminOnly: true },
    { label: 'Audit Log', href: '/admin/audit', icon: 'fa-solid fa-clipboard-list', adminOnly: true },
];

export default function AdminSidebar({ user, onLogout }: AdminSidebarProps) {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/admin/dashboard') {
            return pathname === '/admin/dashboard' || pathname === '/admin';
        }
        return pathname.startsWith(href);
    };

    return (
        <aside className="admin-sidebar">
            {/* Logo */}
            <div className="p-6 border-b border-[var(--admin-border)]">
                <Link href="/admin/dashboard" className="text-xl font-bold text-[var(--admin-primary)]">
                    <i className="fa-solid fa-blog mr-2"></i>
                    Blog CMS
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-grow p-4 space-y-1">
                {menuItems.map((item) => {
                    if (item.adminOnly && user?.role !== 'ADMIN') return null;
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active
                                    ? 'bg-[var(--admin-primary)] text-white'
                                    : 'text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-light)] hover:text-[var(--admin-text)]'
                                }`}
                        >
                            <i className={`${item.icon} w-5 text-center`}></i>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-[var(--admin-border)]">
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--admin-primary)] flex items-center justify-center text-white font-bold">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-grow">
                        <p className="font-medium text-sm">{user?.name}</p>
                        <p className="text-xs text-[var(--admin-text-muted)]">{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full mt-2 px-4 py-2 text-sm text-[var(--admin-text-muted)] hover:text-[var(--admin-danger)] transition-colors text-left flex items-center gap-2"
                >
                    <i className="fa-solid fa-right-from-bracket"></i>
                    Sign out
                </button>
            </div>
        </aside>
    );
}
