import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { ConfigModule } from './config';
import { PrismaModule } from './prisma';
import { AuthModule } from './auth';
import { UsersModule } from './users';
import { PostsModule } from './posts';
import { MediaModule } from './media';
import { CategoriesModule } from './categories';
import { TagsModule } from './tags';
import { AuditModule } from './audit';
import { SitemapModule } from './sitemap';
import { DashboardModule } from './dashboard/dashboard.module';
import { JwtAuthGuard } from './common/guards';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // Configuration
    ConfigModule,

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Serve uploaded files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
      },
    }),

    // JWT for guards (global so JwtAuthGuard works in all modules)
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret',
        signOptions: {
          expiresIn: 900, // 15 minutes in seconds
        },
      }),
    }),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    PostsModule,
    MediaModule,
    CategoriesModule,
    TagsModule,
    AuditModule,
    SitemapModule,
    DashboardModule,
  ],
  providers: [
    // Global rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global JWT auth (with @Public() bypass)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
