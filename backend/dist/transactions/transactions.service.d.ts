import { ClientProxy } from '@nestjs/microservices';
import { TransactionsRepository } from './transactions.repository';
import { UsersRepository } from '../users/users.repository';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { PaginatedResponseDto } from './dto/paginated-response.dto';
import { CacheService } from '../cache/cache.service';
import { MetricsService } from '../metrics/metrics.service';
import { LogsService } from '../logs/logs.service';
export declare class TransactionsService {
    private readonly transactionsRepository;
    private readonly usersRepository;
    private readonly cacheService;
    private readonly metricsService;
    private readonly logsService;
    private readonly rabbitClient;
    constructor(transactionsRepository: TransactionsRepository, usersRepository: UsersRepository, cacheService: CacheService, metricsService: MetricsService, logsService: LogsService, rabbitClient: ClientProxy);
    create(senderId: string, createTransactionDto: CreateTransactionDto): Promise<TransactionResponseDto>;
    findAll(userId: string, paginationQuery: PaginationQueryDto): Promise<PaginatedResponseDto>;
    findById(id: string, userId: string): Promise<TransactionResponseDto>;
    updateStatus(id: string, updateStatusDto: UpdateTransactionStatusDto): Promise<TransactionResponseDto>;
    findAllForAdmin(paginationQuery: PaginationQueryDto): Promise<PaginatedResponseDto>;
}
