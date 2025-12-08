import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getStats() {
        const [totalPosts, publishedPosts, draftPosts, totalUsers] = await Promise.all([
            this.prisma.post.count(),
            this.prisma.post.count({ where: { status: 'PUBLISHED' } }),
            this.prisma.post.count({ where: { status: 'DRAFT' } }),
            this.prisma.user.count(),
        ]);

        return {
            posts: {
                total: totalPosts,
                published: publishedPosts,
                draft: draftPosts,
            },
            users: {
                total: totalUsers,
            },
        };
    }
}
