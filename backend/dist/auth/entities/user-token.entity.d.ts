import { User } from '../../users/entities/user.entity';
export declare class UserToken {
    id: string;
    userId: string;
    user: User;
    token: string;
    expiresAt: Date;
    active: boolean;
    createdAt: Date;
}
