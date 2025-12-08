import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { AuditAction } from '@prisma/client';

export interface AuditLogData {
    userId?: string;
    action: AuditAction | keyof typeof AuditAction;
    entity: string;
    entityId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
}

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async log(data: AuditLogData): Promise<void> {
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId: data.userId,
                    action: data.action as AuditAction,
                    entity: data.entity,
                    entityId: data.entityId,
                    oldValue: data.oldValue ? JSON.parse(JSON.stringify(data.oldValue)) : undefined,
                    newValue: data.newValue ? JSON.parse(JSON.stringify(data.newValue)) : undefined,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent,
                },
            });
        } catch (error) {
            // Don't fail the main operation if audit logging fails
            console.error('Failed to create audit log:', error);
        }
    }

    async findAll(params: {
        page?: number;
        limit?: number;
        entity?: string;
        entityId?: string;
        userId?: string;
        action?: AuditAction;
        startDate?: Date;
        endDate?: Date;
    }) {
        const {
            page = 1,
            limit = 50,
            entity,
            entityId,
            userId,
            action,
            startDate,
            endDate,
        } = params;

        const where: any = {};

        if (entity) where.entity = entity;
        if (entityId) where.entityId = entityId;
        if (userId) where.userId = userId;
        if (action) where.action = action;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return {
            data: logs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findByEntity(entity: string, entityId: string) {
        return this.prisma.auditLog.findMany({
            where: { entity, entityId },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
