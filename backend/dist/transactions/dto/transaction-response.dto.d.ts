import { Transaction } from '../entities/transaction.entity';
import { PaymentMethod } from '../enums/payment-method.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';
export declare class TransactionResponseDto {
    id: string;
    senderId: string;
    senderName: string;
    senderEmail: string;
    receiverId: string;
    receiverName: string;
    receiverEmail: string;
    amount: number;
    paymentMethod: PaymentMethod;
    status: TransactionStatus;
    createdAt: Date;
    static fromEntity(transaction: Transaction): TransactionResponseDto;
}
