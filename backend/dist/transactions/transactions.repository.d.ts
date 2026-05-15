import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionStatus } from './enums/transaction-status.enum';
export declare class TransactionsRepository {
    private readonly repository;
    constructor(repository: Repository<Transaction>);
    create(transactionData: Partial<Transaction>): Promise<Transaction>;
    findAll(): Promise<Transaction[]>;
    findById(id: string): Promise<Transaction | null>;
    findBySenderId(senderId: string): Promise<Transaction[]>;
    findByReceiverId(receiverId: string): Promise<Transaction[]>;
    updateStatus(id: string, status: TransactionStatus): Promise<void>;
}
