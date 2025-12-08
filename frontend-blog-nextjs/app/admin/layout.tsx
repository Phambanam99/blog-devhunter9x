'use client';

import { AuthProvider } from '@/lib/auth-context';
import './admin.css';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AuthProvider>{children}</AuthProvider>;
}
