import { ClientProxy } from '@nestjs/microservices';
import { TransactionsRepository } from './transactions.repository';
import { UsersRepository } from '../users/users.repository';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { CacheService } from '../cache/cache.service';
export declare class TransactionsService {
    private readonly transactionsRepository;
    private readonly usersRepository;
    private readonly cacheService;
    private readonly rabbitClient;
    constructor(transactionsRepository: TransactionsRepository, usersRepository: UsersRepository, cacheService: CacheService, rabbitClient: ClientProxy);
    create(senderId: string, createTransactionDto: CreateTransactionDto): Promise<TransactionResponseDto>;
    findAll(): Promise<TransactionResponseDto[]>;
    findById(id: string): Promise<TransactionResponseDto>;
    updateStatus(id: string, updateStatusDto: UpdateTransactionStatusDto): Promise<TransactionResponseDto>;
}
