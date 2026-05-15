import { User } from '../../users/entities/user.entity';
import { PaymentMethod } from '../enums/payment-method.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';
export declare class Transaction {
    id: string;
    senderId: string;
    sender: User;
    receiverId: string;
    receiver: User;
    amount: number;
    paymentMethod: PaymentMethod;
    status: TransactionStatus;
    createdAt: Date;
}
