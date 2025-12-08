import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { MediaType } from '@prisma/client';

export class UploadMediaDto {
    @IsString()
    @IsOptional()
    alt?: string;

    @IsString()
    @IsOptional()
    caption?: string;
}

export class UpdateMediaDto {
    @IsString()
    @IsOptional()
    alt?: string;

    @IsString()
    @IsOptional()
    caption?: string;
}

export class MediaQueryDto {
    page?: number;
    limit?: number;
    type?: MediaType;
    search?: string;
}
