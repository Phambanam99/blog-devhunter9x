import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@Controller('api/admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    @Roles('EDITOR')
    async getStats() {
        return this.dashboardService.getStats();
    }
}
