import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface AuthUser {
    id: string;
    email: string;
    name: string;
}

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // Máximo 5 transações por minuto
    async create(
        @CurrentUser() user: AuthUser,
        @Body() createTransactionDto: CreateTransactionDto,
    ): Promise<TransactionResponseDto> {
        return this.transactionsService.create(user.id, createTransactionDto);
    }

    @Get()
    async findAll(
        @CurrentUser() user: AuthUser,
    ): Promise<TransactionResponseDto[]> {
        return this.transactionsService.findAll(user.id);
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
