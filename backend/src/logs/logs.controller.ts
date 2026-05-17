import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { PaginationQueryDto } from '../transactions/dto/pagination-query.dto';

@Controller('logs')
@UseGuards(JwtAuthGuard, AdminGuard)
export class LogsController {
    constructor(private readonly logsService: LogsService) { }

    @Get()
    async findAll(@Query() paginationQuery: PaginationQueryDto) {
        const { page = 1, limit = 10 } = paginationQuery;
        return await this.logsService.findAll(page, limit);
    }

    @Get('transaction/:transactionId')
    async findByTransactionId(@Param('transactionId') transactionId: string) {
        return await this.logsService.findByTransactionId(transactionId);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return await this.logsService.findById(id);
    }
}
