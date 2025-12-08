import {
    Controller,
    Get,
    Query,
    UseGuards,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { AuditAction } from '@prisma/client';

@Controller('api/admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
        @Query('entity') entity?: string,
        @Query('entityId') entityId?: string,
        @Query('userId') userId?: string,
        @Query('action') action?: AuditAction,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.auditService.findAll({
            page,
            limit: Math.min(limit, 100), // Max 100
            entity,
            entityId,
            userId,
            action,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
    }
}
