import { PaymentMethod } from '../enums/payment-method.enum';
export declare class CreateTransactionDto {
    receiverEmail: string;
    amount: number;
    paymentMethod: PaymentMethod;
}
