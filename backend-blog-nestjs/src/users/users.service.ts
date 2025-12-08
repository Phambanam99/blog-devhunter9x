import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private auditService: AuditService,
    ) { }

    async create(dto: CreateUserDto, createdById?: string): Promise<UserResponseDto> {
        // Check if email exists
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existing) {
            throw new ConflictException('Email already in use');
        }

        const passwordHash = await bcrypt.hash(dto.password, 12);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                name: dto.name,
                role: dto.role || 'AUTHOR',
            },
        });

        await this.auditService.log({
            userId: createdById,
            action: 'CREATE',
            entity: 'User',
            entityId: user.id,
            newValue: { email: user.email, name: user.name, role: user.role },
        });

        return this.toResponseDto(user);
    }

    async findAll(params: { page?: number; limit?: number; search?: string }) {
        const { page = 1, limit = 20, search } = params;

        const where: any = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: users.map(this.toResponseDto),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string): Promise<UserResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.toResponseDto(user);
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async update(id: string, dto: UpdateUserDto, updatedById?: string): Promise<UserResponseDto> {
        const existing = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('User not found');
        }

        const user = await this.prisma.user.update({
            where: { id },
            data: dto,
        });

        await this.auditService.log({
            userId: updatedById,
            action: 'UPDATE',
            entity: 'User',
            entityId: user.id,
            oldValue: { name: existing.name, role: existing.role, isActive: existing.isActive },
            newValue: { name: user.name, role: user.role, isActive: user.isActive },
        });

        return this.toResponseDto(user);
    }

    async deactivate(id: string, deactivatedById?: string): Promise<UserResponseDto> {
        const existing = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('User not found');
        }

        const user = await this.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });

        // Invalidate all refresh tokens
        await this.prisma.refreshToken.deleteMany({
            where: { userId: id },
        });

        await this.auditService.log({
            userId: deactivatedById,
            action: 'UPDATE',
            entity: 'User',
            entityId: user.id,
            oldValue: { isActive: true },
            newValue: { isActive: false },
        });

        return this.toResponseDto(user);
    }

    private toResponseDto(user: any): UserResponseDto {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
