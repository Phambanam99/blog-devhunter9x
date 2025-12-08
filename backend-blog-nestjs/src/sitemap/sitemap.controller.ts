import { Controller, Get, Param, Header } from '@nestjs/common';
import { SitemapService } from './sitemap.service';
import { Public } from '../common/decorators';

@Controller('api')
export class SitemapController {
    constructor(private readonly sitemapService: SitemapService) { }

    @Public()
    @Get('sitemap.xml')
    @Header('Content-Type', 'application/xml')
    async getSitemap(): Promise<string> {
        return this.sitemapService.generateSitemap();
    }

    @Public()
    @Get('rss/:locale.xml')
    @Header('Content-Type', 'application/rss+xml')
    async getRss(@Param('locale') locale: string): Promise<string> {
        return this.sitemapService.generateRss(locale);
    }
}
