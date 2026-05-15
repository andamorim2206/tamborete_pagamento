import { Transaction } from '../entities/transaction.entity';
import { PaymentMethod } from '../enums/payment-method.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

export class TransactionResponseDto {
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

    static fromEntity(transaction: Transaction): TransactionResponseDto {
        const response = new TransactionResponseDto();
        response.id = transaction.id!;
        response.senderId = transaction.senderId!;
        response.senderName = transaction.sender?.name || 'N/A';
        response.senderEmail = transaction.sender?.email || 'N/A';
        response.receiverId = transaction.receiverId!;
        response.receiverName = transaction.receiver?.name || 'N/A';
        response.receiverEmail = transaction.receiver?.email || 'N/A';
        response.amount = Number(transaction.amount);
        response.paymentMethod = transaction.paymentMethod!;
        response.status = transaction.status!;
        response.createdAt = transaction.createdAt!;
        return response;
    }
}
