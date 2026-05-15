import { IsEnum, IsNotEmpty } from 'class-validator';
import { TransactionStatus } from '../enums/transaction-status.enum';

export class UpdateTransactionStatusDto {
    @IsNotEmpty({ message: 'O status é obrigatório' })
    @IsEnum(TransactionStatus, {
        message: 'Status inválido. Use: PENDING, PROCESSING, COMPLETED ou FAILED',
    })
    status: TransactionStatus;
}
