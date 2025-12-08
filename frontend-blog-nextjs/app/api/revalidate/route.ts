import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
    const secret = request.nextUrl.searchParams.get('secret');
    const slug = request.nextUrl.searchParams.get('slug');
    const locale = request.nextUrl.searchParams.get('locale') || 'vi';

    // Check for secret to prevent unauthorized revalidation
    if (secret !== process.env.REVALIDATION_SECRET) {
        return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    if (!slug) {
        return NextResponse.json({ message: 'Missing slug parameter' }, { status: 400 });
    }

    try {
        // Revalidate the specific post page
        revalidatePath(`/${locale}/blog/${slug}`);

        // Also revalidate the blog listing and home page
        revalidatePath(`/${locale}/blog`);
        revalidatePath(`/${locale}`);

        return NextResponse.json({
            revalidated: true,
            now: Date.now(),
            path: `/${locale}/blog/${slug}`,
        });
    } catch (err) {
        return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
    }
}
