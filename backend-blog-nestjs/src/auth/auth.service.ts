import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma';
import {
    RegisterDto,
    LoginDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    ChangePasswordDto,
} from './dto';
import { AuditService } from '../audit/audit.service';

export interface JwtPayload {
    sub: string;
    email: string;
    name: string;
    role: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private auditService: AuditService,
    ) { }

    async register(dto: RegisterDto): Promise<AuthTokens> {
        // Check if email already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already in use');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(dto.password, 12);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                name: dto.name,
                role: 'AUTHOR', // Default role
            },
        });

        // Log audit
        await this.auditService.log({
            action: 'CREATE',
            entity: 'User',
            entityId: user.id,
            newValue: { email: user.email, name: user.name, role: user.role },
        });

        return this.generateTokens(user);
    }

    async login(dto: LoginDto, ip?: string, userAgent?: string): Promise<AuthTokens> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Log audit
        await this.auditService.log({
            userId: user.id,
            action: 'LOGIN',
            entity: 'User',
            entityId: user.id,
            ipAddress: ip,
            userAgent,
        });

        return this.generateTokens(user);
    }

    async refreshTokens(refreshToken: string): Promise<AuthTokens> {
        // Find refresh token in database
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });

        if (!storedToken || storedToken.expiresAt < new Date()) {
            // Delete expired token if exists
            if (storedToken) {
                await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
            }
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // Get user
        const user = await this.prisma.user.findUnique({
            where: { id: storedToken.userId },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('User not found or inactive');
        }

        // Delete old refresh token
        await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

        return this.generateTokens(user);
    }

    async logout(userId: string, refreshToken?: string): Promise<void> {
        if (refreshToken) {
            await this.prisma.refreshToken.deleteMany({
                where: { token: refreshToken, userId },
            });
        } else {
            // Logout from all devices
            await this.prisma.refreshToken.deleteMany({
                where: { userId },
            });
        }

        await this.auditService.log({
            userId,
            action: 'LOGOUT',
            entity: 'User',
            entityId: userId,
        });
    }

    async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        // Always return success message to prevent email enumeration
        if (!user) {
            return { message: 'If the email exists, a reset link will be sent' };
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });

        // TODO: Send email with reset link
        // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

        console.log(`Password reset token for ${user.email}: ${resetToken}`);

        return { message: 'If the email exists, a reset link will be sent' };
    }

    async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: dto.token,
                resetTokenExpiry: { gt: new Date() },
            },
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        const passwordHash = await bcrypt.hash(dto.newPassword, 12);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        // Invalidate all refresh tokens
        await this.prisma.refreshToken.deleteMany({
            where: { userId: user.id },
        });

        await this.auditService.log({
            userId: user.id,
            action: 'PASSWORD_RESET',
            entity: 'User',
            entityId: user.id,
        });

        return { message: 'Password reset successfully' };
    }

    async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.passwordHash) {
            throw new BadRequestException('User not found');
        }

        const isCurrentPasswordValid = await bcrypt.compare(
            dto.currentPassword,
            user.passwordHash,
        );

        if (!isCurrentPasswordValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        const passwordHash = await bcrypt.hash(dto.newPassword, 12);

        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });

        return { message: 'Password changed successfully' };
    }

    private async generateTokens(user: any): Promise<AuthTokens> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: 900, // 15 minutes in seconds
        });

        const refreshToken = crypto.randomBytes(40).toString('hex');
        const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
        const expiresAt = new Date();

        // Parse refresh expiry (e.g., '7d' -> 7 days)
        const match = refreshExpiresIn.match(/^(\d+)([dhms])$/);
        if (match) {
            const value = parseInt(match[1], 10);
            const unit = match[2];
            switch (unit) {
                case 'd': expiresAt.setDate(expiresAt.getDate() + value); break;
                case 'h': expiresAt.setHours(expiresAt.getHours() + value); break;
                case 'm': expiresAt.setMinutes(expiresAt.getMinutes() + value); break;
                case 's': expiresAt.setSeconds(expiresAt.getSeconds() + value); break;
            }
        } else {
            expiresAt.setDate(expiresAt.getDate() + 7); // Default 7 days
        }

        // Store refresh token
        await this.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt,
            },
        });

        return { accessToken, refreshToken };
    }
}
