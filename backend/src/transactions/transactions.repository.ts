import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionStatus } from './enums/transaction-status.enum';

@Injectable()
export class TransactionsRepository {
    constructor(
        @InjectRepository(Transaction)
        private readonly repository: Repository<Transaction>,
    ) { }

    async create(transactionData: Partial<Transaction>): Promise<Transaction> {
        const transaction = this.repository.create(transactionData);
        return this.repository.save(transaction);
    }

    async findAll(): Promise<Transaction[]> {
        return this.repository.find({
            relations: ['sender', 'receiver'],
            order: { createdAt: 'DESC' },
        });
    }

    async findById(id: string): Promise<Transaction | null> {
        return this.repository.findOne({
            where: { id },
            relations: ['sender', 'receiver'],
        });
    }

    async findBySenderId(senderId: string): Promise<Transaction[]> {
        return this.repository.find({
            where: { senderId },
            relations: ['sender', 'receiver'],
            order: { createdAt: 'DESC' },
        });
    }

    async findByReceiverId(receiverId: string): Promise<Transaction[]> {
        return this.repository.find({
            where: { receiverId },
            relations: ['sender', 'receiver'],
            order: { createdAt: 'DESC' },
        });
    }

    async findByUserId(userId: string): Promise<Transaction[]> {
        return this.repository
            .createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.sender', 'sender')
            .leftJoinAndSelect('transaction.receiver', 'receiver')
            .where('transaction.senderId = :userId OR transaction.receiverId = :userId', { userId })
            .orderBy('transaction.createdAt', 'DESC')
            .getMany();
    }

    async updateStatus(id: string, status: TransactionStatus): Promise<void> {
        await this.repository.update(id, { status });
    }
}
