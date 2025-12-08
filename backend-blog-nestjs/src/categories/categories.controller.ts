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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser, Public } from '../common/decorators';

// Admin Controller
@Controller('api/admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesAdminController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    @Roles('EDITOR')
    async create(
        @Body() dto: CreateCategoryDto,
        @CurrentUser('sub') userId: string,
    ) {
        return this.categoriesService.create(dto, userId);
    }

    @Get()
    @Roles('AUTHOR')
    async findAll(@Query('locale') locale?: string) {
        return this.categoriesService.findAll(locale);
    }

    @Get(':id')
    @Roles('AUTHOR')
    async findOne(@Param('id') id: string) {
        return this.categoriesService.findOne(id);
    }

    @Patch(':id')
    @Roles('EDITOR')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateCategoryDto,
        @CurrentUser('sub') userId: string,
    ) {
        return this.categoriesService.update(id, dto, userId);
    }

    @Delete(':id')
    @Roles('ADMIN')
    async delete(
        @Param('id') id: string,
        @CurrentUser('sub') userId: string,
    ) {
        return this.categoriesService.delete(id, userId);
    }
}

// Public Controller
@Controller('api/categories')
export class CategoriesPublicController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Public()
    @Get()
    async findAll(@Query('locale') locale?: string) {
        return this.categoriesService.findAll(locale);
    }

    @Public()
    @Get(':locale/:slug')
    async findBySlug(
        @Param('locale') locale: string,
        @Param('slug') slug: string,
    ) {
        return this.categoriesService.findBySlug(slug, locale);
    }
}
