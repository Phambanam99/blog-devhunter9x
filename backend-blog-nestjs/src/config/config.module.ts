import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import appConfig from './app.config';
import jwtConfig from './jwt.config';
import storageConfig from './storage.config';

@Module({
    imports: [
        NestConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, jwtConfig, storageConfig],
            envFilePath: ['.env.local', '.env'],
        }),
    ],
})
export class ConfigModule { }
