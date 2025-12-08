import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Query,
    Body,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    ParseIntPipe,
    DefaultValuePipe,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { UpdateMediaDto, MediaQueryDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { MediaType } from '@prisma/client';

@Controller('api/admin/media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
    constructor(private readonly mediaService: MediaService) { }

    @Post('upload')
    @Roles('AUTHOR')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: {
                fileSize: 52428800, // 50MB
            },
        }),
    )
    async upload(
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser('sub') userId: string,
        @Body('alt') alt?: string,
        @Body('caption') caption?: string,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        return this.mediaService.upload(
            {
                fieldname: file.fieldname,
                originalname: file.originalname,
                encoding: file.encoding,
                mimetype: file.mimetype,
                buffer: file.buffer,
                size: file.size,
            },
            userId,
            alt,
            caption,
        );
    }

    @Get()
    @Roles('AUTHOR')
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
        @Query('type') type?: MediaType,
        @Query('search') search?: string,
    ) {
        return this.mediaService.findAll({
            page,
            limit: Math.min(limit, 100),
            type,
            search,
        });
    }

    @Get(':id')
    @Roles('AUTHOR')
    async findOne(@Param('id') id: string) {
        return this.mediaService.findOne(id);
    }

    @Patch(':id')
    @Roles('AUTHOR')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateMediaDto,
        @CurrentUser('sub') userId: string,
    ) {
        return this.mediaService.update(id, dto, userId);
    }

    @Delete(':id')
    @Roles('EDITOR')
    async delete(
        @Param('id') id: string,
        @CurrentUser('sub') userId: string,
    ) {
        return this.mediaService.delete(id, userId);
    }
}
