import { User } from '../entities/user.entity';

export class UserResponseDto {
    id!: string;
    name!: string;
    email!: string;
    balance!: number;
    createdAt!: Date;
    updatedAt!: Date;

    static fromEntity(user: User): UserResponseDto {
        const response = new UserResponseDto();
        response.id = user.id!;
        response.name = user.name!;
        response.email = user.email!;
        response.balance = Number(user.balance) || 0;
        response.createdAt = user.createdAt!;
        response.updatedAt = user.updatedAt!;
        return response;
    }
}
