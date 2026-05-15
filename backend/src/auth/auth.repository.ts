import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserToken } from './entities/user-token.entity';

@Injectable()
export class AuthRepository {
    constructor(
        @InjectRepository(UserToken)
        private readonly repository: Repository<UserToken>,
    ) { }

    async createToken(
        userId: string,
        token: string,
        expiresAt: Date,
    ): Promise<UserToken> {
        const userToken = this.repository.create({
            userId,
            token,
            expiresAt,
        });
        return this.repository.save(userToken);
    }

    async findActiveTokenByUserId(userId: string): Promise<UserToken | null> {
        return this.repository.findOne({
            where: {
                userId,
                active: true,
            },
            order: {
                createdAt: 'DESC',
            },
        });
    }

    async findByToken(token: string): Promise<UserToken | null> {
        return this.repository.findOne({
            where: { token, active: true },
            relations: ['user'],
        });
    }

    async deactivateToken(tokenId: string): Promise<void> {
        await this.repository.update(tokenId, { active: false });
    }

    async deactivateAllUserTokens(userId: string): Promise<void> {
        await this.repository.update(
            { userId, active: true },
            { active: false },
        );
    }
}
