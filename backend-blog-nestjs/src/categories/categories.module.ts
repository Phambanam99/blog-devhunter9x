import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesAdminController, CategoriesPublicController } from './categories.controller';

@Module({
    controllers: [CategoriesAdminController, CategoriesPublicController],
    providers: [CategoriesService],
    exports: [CategoriesService],
})
export class CategoriesModule { }
