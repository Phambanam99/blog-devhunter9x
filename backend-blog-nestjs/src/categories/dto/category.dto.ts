import { IsString, IsOptional, IsArray, ValidateNested, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CategoryTranslationDto {
    @IsString()
    locale: string;

    @IsString()
    @MinLength(1)
    name: string;

    @IsString()
    @MinLength(1)
    slug: string;

    @IsString()
    @IsOptional()
    description?: string;
}

export class CreateCategoryDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CategoryTranslationDto)
    translations: CategoryTranslationDto[];

    @IsString()
    @IsOptional()
    parentId?: string;
}

export class UpdateCategoryDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CategoryTranslationDto)
    @IsOptional()
    translations?: CategoryTranslationDto[];

    @IsString()
    @IsOptional()
    parentId?: string;
}
