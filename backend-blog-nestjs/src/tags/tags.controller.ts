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
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto, UpdateTagDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser, Public } from '../common/decorators';

@Controller('api/admin/tags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TagsAdminController {
    constructor(private readonly tagsService: TagsService) { }

    @Post()
    @Roles('EDITOR')
    async create(
        @Body() dto: CreateTagDto,
        @CurrentUser('sub') userId: string,
    ) {
        return this.tagsService.create(dto, userId);
    }

    @Get()
    @Roles('AUTHOR')
    async findAll(@Query('locale') locale?: string) {
        return this.tagsService.findAll(locale);
    }

    @Get(':id')
    @Roles('AUTHOR')
    async findOne(@Param('id') id: string) {
        return this.tagsService.findOne(id);
    }

    @Patch(':id')
    @Roles('EDITOR')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateTagDto,
        @CurrentUser('sub') userId: string,
    ) {
        return this.tagsService.update(id, dto, userId);
    }

    @Delete(':id')
    @Roles('ADMIN')
    async delete(
        @Param('id') id: string,
        @CurrentUser('sub') userId: string,
    ) {
        return this.tagsService.delete(id, userId);
    }
}

@Controller('api/tags')
export class TagsPublicController {
    constructor(private readonly tagsService: TagsService) { }

    @Public()
    @Get()
    async findAll(@Query('locale') locale?: string) {
        return this.tagsService.findAll(locale);
    }

    @Public()
    @Get(':locale/:slug')
    async findBySlug(
        @Param('locale') locale: string,
        @Param('slug') slug: string,
    ) {
        return this.tagsService.findBySlug(slug, locale);
    }
}
