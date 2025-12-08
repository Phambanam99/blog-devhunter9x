'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.push('/admin/dashboard');
        }
    }, [isAuthenticated, authLoading, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            router.push('/admin/dashboard');
        } catch (err: any) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--admin-primary)] to-[var(--admin-secondary)] bg-clip-text text-transparent">
                        Blog CMS
                    </h1>
                    <p className="text-[var(--admin-text-secondary)] mt-2">
                        Sign in to manage your blog
                    </p>
                </div>

                {/* Login Form */}
                <div className="admin-card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="admin-input"
                                placeholder="admin@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="admin-input"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="admin-btn admin-btn-primary w-full"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/" className="text-sm text-[var(--admin-text-muted)] hover:text-[var(--admin-primary)]">
                            ← Back to website
                        </Link>
                    </div>
                </div>

                {/* Demo credentials */}
                <div className="mt-6 p-4 admin-card">
                    <p className="text-sm text-[var(--admin-text-secondary)] mb-2">Demo Credentials:</p>
                    <div className="text-xs text-[var(--admin-text-muted)] space-y-1">
                        <p><strong>Admin:</strong> admin@example.com / admin123</p>
                        <p><strong>Editor:</strong> editor@example.com / editor123</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
