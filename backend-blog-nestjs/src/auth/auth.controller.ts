import {
    Controller,
    Post,
    Get,
    Body,
    HttpCode,
    HttpStatus,
    Req,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService, AuthTokens } from './auth.service';
import {
    RegisterDto,
    LoginDto,
    RefreshTokenDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    ChangePasswordDto,
} from './dto';
import { Public } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@Controller('api/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('register')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
    async register(@Body() dto: RegisterDto): Promise<AuthTokens> {
        return this.authService.register(dto);
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
    async login(
        @Body() dto: LoginDto,
        @Req() req: Request,
    ): Promise<AuthTokens> {
        const ip = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        return this.authService.login(dto, ip, userAgent);
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokens> {
        return this.authService.refreshTokens(dto.refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(
        @CurrentUser('sub') userId: string,
        @Body() body: { refreshToken?: string },
    ): Promise<{ message: string }> {
        await this.authService.logout(userId, body.refreshToken);
        return { message: 'Logged out successfully' };
    }

    @Public()
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
    async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
        return this.authService.forgotPassword(dto);
    }

    @Public()
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
    async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
        return this.authService.resetPassword(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    async changePassword(
        @CurrentUser('sub') userId: string,
        @Body() dto: ChangePasswordDto,
    ): Promise<{ message: string }> {
        return this.authService.changePassword(userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async me(@CurrentUser() user: any): Promise<any> {
        return {
            id: user.sub,
            email: user.email,
            name: user.name,
            role: user.role,
        };
    }
}
