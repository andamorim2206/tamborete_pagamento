import { Repository } from 'typeorm';
import { UserToken } from './entities/user-token.entity';
export declare class AuthRepository {
    private readonly repository;
    constructor(repository: Repository<UserToken>);
    createToken(userId: string, token: string, expiresAt: Date): Promise<UserToken>;
    findActiveTokenByUserId(userId: string): Promise<UserToken | null>;
    findByToken(token: string): Promise<UserToken | null>;
    deactivateToken(tokenId: string): Promise<void>;
    deactivateAllUserTokens(userId: string): Promise<void>;
}
