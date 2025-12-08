import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';

@Controller('api/admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    async create(
        @Body() dto: CreateUserDto,
        @CurrentUser('sub') userId: string,
    ) {
        return this.usersService.create(dto, userId);
    }

    @Get()
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('search') search?: string,
    ) {
        return this.usersService.findAll({
            page,
            limit: Math.min(limit, 100),
            search,
        });
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateUserDto,
        @CurrentUser('sub') userId: string,
    ) {
        return this.usersService.update(id, dto, userId);
    }

    @Delete(':id')
    async deactivate(
        @Param('id') id: string,
        @CurrentUser('sub') userId: string,
    ) {
        return this.usersService.deactivate(id, userId);
    }
}
