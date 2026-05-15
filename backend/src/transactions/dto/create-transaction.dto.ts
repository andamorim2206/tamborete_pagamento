import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { PaymentMethod } from '../enums/payment-method.enum';

export class CreateTransactionDto {
    @IsNotEmpty({ message: 'O email do destinatário é obrigatório' })
    @IsEmail({}, { message: 'Email do destinatário inválido' })
    receiverEmail: string;

    @IsNotEmpty({ message: 'O valor é obrigatório' })
    @IsNumber({}, { message: 'O valor deve ser um número' })
    @IsPositive({ message: 'O valor deve ser positivo' })
    amount: number;

    @IsNotEmpty({ message: 'O método de pagamento é obrigatório' })
    @IsEnum(PaymentMethod, {
        message: 'Método de pagamento inválido. Use: PIX ou CARTAO_DE_CREDITO',
    })
    paymentMethod: PaymentMethod;
}
