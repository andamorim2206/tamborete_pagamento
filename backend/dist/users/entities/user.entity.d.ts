import { UserRole } from '../enums/user-role.enum';
export declare class User {
    id: string | undefined;
    name: string | undefined;
    email: string | undefined;
    password: string | undefined;
    role: UserRole | undefined;
    balance: number | undefined;
    createdAt: Date | undefined;
    updatedAt: Date | undefined;
}
