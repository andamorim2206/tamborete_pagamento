import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersRepository {
    constructor(
        @InjectRepository(User)
        private readonly repository: Repository<User>,
    ) { }

    async create(user: Partial<User>): Promise<User> {
        const newUser = this.repository.create(user);
        return this.repository.save(newUser);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.repository.findOne({ where: { email } });
    }

    async findById(id: string): Promise<User | null> {
        return this.repository.findOne({ where: { id } });
    }

    async findAll(): Promise<User[]> {
        return this.repository.find({
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Atualiza o saldo do usuário
     * @param userId ID do usuário
     * @param newBalance Novo saldo
     */
    async updateBalance(userId: string, newBalance: number): Promise<void> {
        await this.repository.update(userId, { balance: newBalance });
    }

    /**
     * Debita valor do saldo do usuário
     * @param userId ID do usuário
     * @param amount Valor a debitar
     */
    async debitBalance(userId: string, amount: number): Promise<void> {
        await this.repository.decrement({ id: userId }, 'balance', amount);
    }

    /**
     * Credita valor no saldo do usuário
     * @param userId ID do usuário
     * @param amount Valor a creditar
     */
    async creditBalance(userId: string, amount: number): Promise<void> {
        await this.repository.increment({ id: userId }, 'balance', amount);
    }
}
