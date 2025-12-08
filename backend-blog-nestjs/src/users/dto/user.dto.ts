import { IsEmail, IsString, IsEnum, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsString()
    @MinLength(2)
    name: string;

    @IsEnum(Role)
    @IsOptional()
    role?: Role;
}

export class UpdateUserDto {
    @IsString()
    @MinLength(2)
    @IsOptional()
    name?: string;

    @IsEnum(Role)
    @IsOptional()
    role?: Role;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsString()
    @IsOptional()
    avatar?: string;
}

export class UserResponseDto {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    role: Role;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
