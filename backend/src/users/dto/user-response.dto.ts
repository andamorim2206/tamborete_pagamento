import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';

export class UserResponseDto {
    id!: string;
    name!: string;
    email!: string;
    balance!: number;
    role!: UserRole;
    createdAt!: Date;
    updatedAt!: Date;

    static fromEntity(user: User): UserResponseDto {
        const response = new UserResponseDto();
        response.id = user.id!;
        response.name = user.name!;
        response.email = user.email!;
        response.balance = Number(user.balance) || 0;
        response.role = user.role || UserRole.USER;
        response.createdAt = user.createdAt!;
        response.updatedAt = user.updatedAt!;
        return response;
    }
}
