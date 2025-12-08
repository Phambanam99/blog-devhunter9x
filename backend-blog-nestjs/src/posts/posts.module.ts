import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsAdminController, PostsPublicController, PreviewController } from './posts.controller';

@Module({
    controllers: [PostsAdminController, PostsPublicController, PreviewController],
    providers: [PostsService],
    exports: [PostsService],
})
export class PostsModule { }
