import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
interface AuthUser {
    id: string;
    email: string;
    name: string;
}
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    create(user: AuthUser, createTransactionDto: CreateTransactionDto): Promise<TransactionResponseDto>;
    findAll(user: AuthUser): Promise<TransactionResponseDto[]>;
    findById(user: AuthUser, id: string): Promise<TransactionResponseDto>;
    updateStatus(id: string, updateStatusDto: UpdateTransactionStatusDto): Promise<TransactionResponseDto>;
}
export {};
