import { User } from '../entities/user.entity';
export declare class UserResponseDto {
    id: string;
    name: string;
    email: string;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
    static fromEntity(user: User): UserResponseDto;
}
