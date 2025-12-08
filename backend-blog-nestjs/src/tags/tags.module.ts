import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsAdminController, TagsPublicController } from './tags.controller';

@Module({
    controllers: [TagsAdminController, TagsPublicController],
    providers: [TagsService],
    exports: [TagsService],
})
export class TagsModule { }
