import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { PaginatedResponseDto } from './dto/paginated-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface AuthUser {
    id: string;
    email: string;
    name: string;
    role?: string;
}

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    async create(
        @CurrentUser() user: AuthUser,
        @Body() createTransactionDto: CreateTransactionDto,
    ): Promise<TransactionResponseDto> {
        return this.transactionsService.create(user.id, createTransactionDto);
    }

    @Get()
    async findAll(
        @CurrentUser() user: AuthUser,
        @Query() paginationQuery: PaginationQueryDto,
    ): Promise<PaginatedResponseDto> {
        return this.transactionsService.findAll(user.id, paginationQuery);
    }

    @Get('admin/all')
    @UseGuards(AdminGuard)
    async findAllForAdmin(
        @Query() paginationQuery: PaginationQueryDto,
    ): Promise<PaginatedResponseDto> {
        return this.transactionsService.findAllForAdmin(paginationQuery);
    }

    @Get(':id')
    async findById(
        @CurrentUser() user: AuthUser,
        @Param('id') id: string,
    ): Promise<TransactionResponseDto> {
        return this.transactionsService.findById(id, user.id);
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body() updateStatusDto: UpdateTransactionStatusDto,
    ): Promise<TransactionResponseDto> {
        return this.transactionsService.updateStatus(id, updateStatusDto);
    }
}
