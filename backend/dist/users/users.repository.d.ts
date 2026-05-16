import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersRepository {
    private readonly repository;
    constructor(repository: Repository<User>);
    create(user: Partial<User>): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    updateBalance(userId: string, newBalance: number): Promise<void>;
    debitBalance(userId: string, amount: number): Promise<void>;
    creditBalance(userId: string, amount: number): Promise<void>;
}
