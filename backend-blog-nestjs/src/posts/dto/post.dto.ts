import {
    IsString,
    IsEnum,
    IsOptional,
    IsArray,
    IsDateString,
    ValidateNested,
    MinLength,
    IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from '@prisma/client';

export class TranslationDto {
    @IsString()
    locale: string; // 'vi' | 'en'

    @IsString()
    @MinLength(1)
    title: string;

    @IsString()
    @MinLength(1)
    slug: string;

    @IsString()
    @IsOptional()
    excerpt?: string;

    @IsString()
    body: string; // Markdown

    @IsString()
    @IsOptional()
    metaTitle?: string;

    @IsString()
    @IsOptional()
    metaDescription?: string;

    @IsString()
    @IsOptional()
    canonical?: string;

    @IsString()
    @IsOptional()
    ogImage?: string;

    @IsString()
    @IsOptional()
    schemaType?: string; // 'Article' | 'FAQ' | 'HowTo' | 'BlogPosting'

    @IsObject()
    @IsOptional()
    schemaData?: any;

    @IsString()
    @IsOptional()
    heroImageId?: string;
}

export class CreatePostDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TranslationDto)
    translations: TranslationDto[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    categoryIds?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tagIds?: string[];

    @IsEnum(PostStatus)
    @IsOptional()
    status?: PostStatus;

    @IsDateString()
    @IsOptional()
    publishAt?: string;
}

export class UpdatePostDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TranslationDto)
    @IsOptional()
    translations?: TranslationDto[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    categoryIds?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tagIds?: string[];

    @IsEnum(PostStatus)
    @IsOptional()
    status?: PostStatus;

    @IsDateString()
    @IsOptional()
    publishAt?: string;
}

export class PublishPostDto {
    @IsDateString()
    @IsOptional()
    publishAt?: string; // For scheduling
}

export class PostQueryDto {
    page?: number;
    limit?: number;
    status?: PostStatus;
    locale?: string;
    search?: string;
    categoryId?: string;
    tagId?: string;
    authorId?: string;
}
