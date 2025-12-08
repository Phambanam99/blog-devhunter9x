// Admin API client with authentication
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
}

async function authFetch(url: string, options: RequestInit = {}) {
    const token = getToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
        if (res.status === 401) {
            localStorage.removeItem('accessToken');
            window.location.href = '/admin/login';
            throw new Error('Unauthorized');
        }
        let errorMessage = 'An error occurred';
        try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
            if (Array.isArray(errorMessage)) errorMessage = errorMessage.join(', ');
        } catch (e) {
            // Ignore JSON parse error, use status text
            errorMessage = res.statusText;
        }
        throw new Error(errorMessage);
    }
    return res;
}

// Posts API
export async function getAdminPosts(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const res = await authFetch(`${API_URL}/admin/posts?${query}`);
    if (!res.ok) throw new Error('Failed to fetch posts');
    return res.json();
}

export async function getAdminPost(id: string) {
    const res = await authFetch(`${API_URL}/admin/posts/${id}`);
    if (!res.ok) throw new Error('Failed to fetch post');
    return res.json();
}

export async function createPost(data: any) {
    const res = await authFetch(`${API_URL}/admin/posts`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to create post');
    return res.json();
}

export async function updatePost(id: string, data: any) {
    const res = await authFetch(`${API_URL}/admin/posts/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update post');
    return res.json();
}

export async function deletePost(id: string) {
    const res = await authFetch(`${API_URL}/admin/posts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete post');
}

export async function publishPost(id: string) {
    const res = await authFetch(`${API_URL}/admin/posts/${id}/publish`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to publish post');
    return res.json();
}

// Categories API
export async function getAdminCategories() {
    const res = await authFetch(`${API_URL}/admin/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
}

export async function createCategory(data: any) {
    const res = await authFetch(`${API_URL}/admin/categories`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
}

export async function updateCategory(id: string, data: any) {
    const res = await authFetch(`${API_URL}/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update category');
    return res.json();
}

export async function deleteCategory(id: string) {
    const res = await authFetch(`${API_URL}/admin/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete category');
}

// Tags API
export async function getAdminTags() {
    const res = await authFetch(`${API_URL}/admin/tags`);
    if (!res.ok) throw new Error('Failed to fetch tags');
    return res.json();
}

export async function createTag(data: any) {
    const res = await authFetch(`${API_URL}/admin/tags`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to create tag');
    return res.json();
}

export async function updateTag(id: string, data: any) {
    const res = await authFetch(`${API_URL}/admin/tags/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update tag');
    return res.json();
}

export async function deleteTag(id: string) {
    const res = await authFetch(`${API_URL}/admin/tags/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete tag');
}

// Media API
export async function getAdminMedia(params?: { page?: number; limit?: number; type?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.type) query.set('type', params.type);
    const res = await authFetch(`${API_URL}/admin/media?${query}`);
    if (!res.ok) throw new Error('Failed to fetch media');
    return res.json();
}

export async function uploadMedia(file: File, meta?: { alt?: string; caption?: string }) {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    if (meta?.alt) formData.append('alt', meta.alt);
    if (meta?.caption) formData.append('caption', meta.caption);
    const res = await fetch(`${API_URL}/admin/media/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload media');
    return res.json();
}

export async function deleteMedia(id: string) {
    const res = await authFetch(`${API_URL}/admin/media/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete media');
}

// Users API (Admin only)
export async function getAdminUsers() {
    const res = await authFetch(`${API_URL}/admin/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
}

export async function createUser(data: any) {
    const res = await authFetch(`${API_URL}/admin/users`, { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
}

export async function updateUser(id: string, data: any) {
    const res = await authFetch(`${API_URL}/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
}

export async function deleteUser(id: string) {
    const res = await authFetch(`${API_URL}/admin/users/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete user');
}

// Audit API (Admin only)
export async function getAuditLogs(params?: { page?: number; limit?: number; action?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.action) query.set('action', params.action);
    const res = await authFetch(`${API_URL}/admin/audit?${query}`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
}

// Dashboard stats
export async function getDashboardStats() {
    const res = await authFetch(`${API_URL}/admin/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
}
