import {
    BadRequestException,
    Injectable,
    NotFoundException,
    Inject,
    ConflictException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TransactionsRepository } from './transactions.repository';
import { UsersRepository } from '../users/users.repository';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionStatus } from './enums/transaction-status.enum';
import { CacheService } from '../cache/cache.service';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class TransactionsService {
    constructor(
        private readonly transactionsRepository: TransactionsRepository,
        private readonly usersRepository: UsersRepository,
        private readonly cacheService: CacheService,
        private readonly metricsService: MetricsService,
        @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
    ) { }

    async create(
        senderId: string,
        createTransactionDto: CreateTransactionDto,
    ): Promise<TransactionResponseDto> {
        // 1. IDEMPOTÊNCIA: Verificar se já existe transação idêntica recentemente (1 minuto)
        const idempotencyKey = `idempotency:${senderId}:${createTransactionDto.receiverEmail}:${createTransactionDto.amount}:${createTransactionDto.paymentMethod}`;
        const existingTransactionId = await this.cacheService.checkIdempotency(idempotencyKey);

        if (existingTransactionId) {
            // Retornar transação já existente
            const existingTransaction = await this.transactionsRepository.findById(existingTransactionId);
            if (existingTransaction) {
                throw new ConflictException({
                    message: 'Espere um momento, sua proxima transação podera ser processada. Transação idêntica já foi criada recentemente.',
                    transactionId: existingTransactionId,
                    transaction: TransactionResponseDto.fromEntity(existingTransaction),
                });
            }
        }

        // 2. Buscar receiver pelo email
        const receiver = await this.usersRepository.findByEmail(
            createTransactionDto.receiverEmail,
        );

        if (!receiver) {
            throw new BadRequestException(
                'Usuário destinatário não encontrado',
            );
        }

        // 3. Validar que não está enviando para si mesmo
        if (receiver.id === senderId) {
            throw new BadRequestException(
                'Não é possível enviar transação para si mesmo',
            );
        }

        // 4. Validar saldo suficiente do sender
        const sender = await this.usersRepository.findById(senderId);
        if (!sender) {
            throw new BadRequestException('Usuário remetente não encontrado');
        }

        const senderBalance = Number(sender.balance) || 0;
        if (senderBalance < createTransactionDto.amount) {
            throw new BadRequestException(
                `Saldo insuficiente. Saldo disponível: R$ ${senderBalance.toFixed(2)}`,
            );
        }

        // 5. Criar transação com status PENDING
        const transaction = await this.transactionsRepository.create({
            senderId,
            receiverId: receiver.id,
            amount: createTransactionDto.amount,
            paymentMethod: createTransactionDto.paymentMethod,
            status: TransactionStatus.PENDING,
        });

        // 6. Marcar como processada no cache de idempotência (TTL: 1 minuto)
        await this.cacheService.setIdempotency(idempotencyKey, transaction.id, 60);

        // 7. Buscar transação completa com os relacionamentos
        const fullTransaction = await this.transactionsRepository.findById(
            transaction.id,
        );

        // 8. Cachear a transação (TTL: 60 segundos)
        await this.cacheService.set(
            `transaction:${transaction.id}`,
            TransactionResponseDto.fromEntity(fullTransaction!),
            60,
        );

        // 9. Invalidar cache de listagem dos usuários envolvidos
        await this.cacheService.del(`transactions:user:${senderId}`);
        await this.cacheService.del(`transactions:user:${receiver.id}`);

        // 10. Enviar para RabbitMQ para processamento assíncrono
        this.rabbitClient.emit('transaction.created', {
            transactionId: transaction.id,
            senderId: transaction.senderId,
            receiverId: transaction.receiverId,
            amount: transaction.amount,
            paymentMethod: transaction.paymentMethod,
        });

        // Registrar métrica de mensagem publicada
        this.metricsService.recordMessagePublished();

        return TransactionResponseDto.fromEntity(fullTransaction!);
    }

    async findAll(userId: string): Promise<TransactionResponseDto[]> {
        // Verificar cache específico do usuário
        const cacheKey = `transactions:user:${userId}`;
        const cached = await this.cacheService.get<TransactionResponseDto[]>(cacheKey);
        if (cached) {
            return cached;
        }

        // Buscar no banco apenas transações do usuário (enviadas ou recebidas)
        const transactions = await this.transactionsRepository.findByUserId(userId);
        const response = transactions.map(TransactionResponseDto.fromEntity);

        // Cachear por 30 segundos (lista muda frequentemente)
        await this.cacheService.set(cacheKey, response, 30);

        return response;
    }

    async findById(id: string, userId: string): Promise<TransactionResponseDto> {
        // Verificar cache
        const cached = await this.cacheService.get<TransactionResponseDto>(`transaction:${id}`);
        if (cached) {
            // Validar permissão mesmo com cache
            if (cached.senderId !== userId && cached.receiverId !== userId) {
                throw new NotFoundException('Transação não encontrada');
            }
            return cached;
        }

        // Buscar no banco
        const transaction = await this.transactionsRepository.findById(id);

        if (!transaction) {
            throw new NotFoundException('Transação não encontrada');
        }

        // Validar se o usuário tem permissão para ver esta transação
        if (transaction.senderId !== userId && transaction.receiverId !== userId) {
            throw new NotFoundException('Transação não encontrada');
        }

        const response = TransactionResponseDto.fromEntity(transaction);

        // Cachear por 60 segundos
        await this.cacheService.set(`transaction:${id}`, response, 60);

        return response;
    }

    async updateStatus(
        id: string,
        updateStatusDto: UpdateTransactionStatusDto,
    ): Promise<TransactionResponseDto> {
        const transaction = await this.transactionsRepository.findById(id);

        if (!transaction) {
            throw new NotFoundException('Transação não encontrada');
        }

        await this.transactionsRepository.updateStatus(id, updateStatusDto.status);

        // Invalidar caches relacionados
        await this.cacheService.del(`transaction:${id}`);
        // Invalidar cache de ambos os usuários envolvidos
        await this.cacheService.del(`transactions:user:${transaction.senderId}`);
        await this.cacheService.del(`transactions:user:${transaction.receiverId}`);

        const updatedTransaction = await this.transactionsRepository.findById(id);

        return TransactionResponseDto.fromEntity(updatedTransaction!);
    }
}
