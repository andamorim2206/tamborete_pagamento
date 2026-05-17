import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';
export declare class UserResponseDto {
    id: string;
    name: string;
    email: string;
    balance: number;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    static fromEntity(user: User): UserResponseDto;
}
