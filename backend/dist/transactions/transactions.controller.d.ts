import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { PaginatedResponseDto } from './dto/paginated-response.dto';
interface AuthUser {
    id: string;
    email: string;
    name: string;
    role?: string;
}
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    create(user: AuthUser, createTransactionDto: CreateTransactionDto): Promise<TransactionResponseDto>;
    findAll(user: AuthUser, paginationQuery: PaginationQueryDto): Promise<PaginatedResponseDto>;
    findAllForAdmin(paginationQuery: PaginationQueryDto): Promise<PaginatedResponseDto>;
    findById(user: AuthUser, id: string): Promise<TransactionResponseDto>;
    updateStatus(id: string, updateStatusDto: UpdateTransactionStatusDto): Promise<TransactionResponseDto>;
}
export {};
