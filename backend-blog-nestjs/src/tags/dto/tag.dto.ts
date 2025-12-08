import { IsString, IsArray, ValidateNested, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class TagTranslationDto {
    @IsString()
    locale: string;

    @IsString()
    @MinLength(1)
    name: string;

    @IsString()
    @MinLength(1)
    slug: string;
}

export class CreateTagDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TagTranslationDto)
    translations: TagTranslationDto[];
}

export class UpdateTagDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TagTranslationDto)
    translations: TagTranslationDto[];
}
