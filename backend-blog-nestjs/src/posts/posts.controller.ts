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
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, PublishPostDto, PostQueryDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser, Public } from '../common/decorators';
import { PostStatus } from '@prisma/client';

// ============ ADMIN CONTROLLER ============
@Controller('api/admin/posts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostsAdminController {
    constructor(private readonly postsService: PostsService) { }

    @Post()
    @Roles('AUTHOR')
    async create(
        @Body() dto: CreatePostDto,
        @CurrentUser('sub') userId: string,
    ) {
        return this.postsService.create(dto, userId);
    }

    @Get()
    @Roles('AUTHOR')
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('status') status?: PostStatus,
        @Query('search') search?: string,
        @Query('categoryId') categoryId?: string,
        @Query('tagId') tagId?: string,
        @Query('authorId') authorId?: string,
    ) {
        return this.postsService.findAllAdmin({
            page,
            limit: Math.min(limit, 100),
            status,
            search,
            categoryId,
            tagId,
            authorId,
        });
    }

    @Get(':id')
    @Roles('AUTHOR')
    async findOne(@Param('id') id: string) {
        return this.postsService.findOneAdmin(id);
    }

    @Patch(':id')
    @Roles('AUTHOR')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdatePostDto,
        @CurrentUser('sub') userId: string,
    ) {
        return this.postsService.update(id, dto, userId);
    }

    @Delete(':id')
    @Roles('ADMIN')
    async delete(
        @Param('id') id: string,
        @CurrentUser('sub') userId: string,
    ) {
        return this.postsService.delete(id, userId);
    }

    @Post(':id/publish')
    @Roles('EDITOR')
    async publish(
        @Param('id') id: string,
        @Body() dto: PublishPostDto,
        @CurrentUser('sub') userId: string,
    ) {
        return this.postsService.publish(id, userId, dto.publishAt);
    }

    @Post(':id/unpublish')
    @Roles('EDITOR')
    async unpublish(
        @Param('id') id: string,
        @CurrentUser('sub') userId: string,
    ) {
        return this.postsService.unpublish(id, userId);
    }

    @Get(':id/revisions/:locale')
    @Roles('EDITOR')
    async getRevisions(
        @Param('id') id: string,
        @Param('locale') locale: string,
    ) {
        return this.postsService.getRevisions(id, locale);
    }

    @Post(':id/rollback/:locale/:version')
    @Roles('EDITOR')
    async rollback(
        @Param('id') id: string,
        @Param('locale') locale: string,
        @Param('version', ParseIntPipe) version: number,
        @CurrentUser('sub') userId: string,
    ) {
        return this.postsService.rollback(id, locale, version, userId);
    }

    @Post(':id/preview-token')
    @Roles('AUTHOR')
    async generatePreviewToken(@Param('id') id: string) {
        return this.postsService.generatePreviewToken(id);
    }
}

// ============ PUBLIC CONTROLLER ============
@Controller('api/posts')
export class PostsPublicController {
    constructor(private readonly postsService: PostsService) { }

    @Public()
    @Get()
    async findPublished(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('locale') locale?: string,
        @Query('categoryId') categoryId?: string,
        @Query('tagId') tagId?: string,
        @Query('search') search?: string,
    ) {
        return this.postsService.findPublished({
            page,
            limit: Math.min(limit, 50),
            locale,
            categoryId,
            tagId,
            search,
        });
    }

    @Public()
    @Get(':locale/:slug')
    async findBySlug(
        @Param('locale') locale: string,
        @Param('slug') slug: string,
    ) {
        return this.postsService.findBySlug(slug, locale);
    }
}

// ============ PREVIEW CONTROLLER ============
@Controller('api/preview')
export class PreviewController {
    constructor(private readonly postsService: PostsService) { }

    @Public()
    @Get(':token')
    async getPreview(@Param('token') token: string) {
        return this.postsService.getByPreviewToken(token);
    }
}
