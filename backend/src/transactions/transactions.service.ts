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
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { PaginatedResponseDto } from './dto/paginated-response.dto';
import { TransactionStatus } from './enums/transaction-status.enum';
import { CacheService } from '../cache/cache.service';
import { MetricsService } from '../metrics/metrics.service';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class TransactionsService {
    constructor(
        private readonly transactionsRepository: TransactionsRepository,
        private readonly usersRepository: UsersRepository,
        private readonly cacheService: CacheService,
        private readonly metricsService: MetricsService,
        private readonly logsService: LogsService,
        @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
    ) { }

    async create(
        senderId: string,
        createTransactionDto: CreateTransactionDto,
    ): Promise<TransactionResponseDto> {
        try {
            const idempotencyKey = `idempotency:${senderId}:${createTransactionDto.receiverEmail}:${createTransactionDto.amount}:${createTransactionDto.paymentMethod}`;
            const existingTransactionId = await this.cacheService.checkIdempotency(idempotencyKey);

            if (existingTransactionId) {
                const existingTransaction = await this.transactionsRepository.findById(existingTransactionId);
                if (existingTransaction) {
                    throw new ConflictException({
                        message: 'Espere um momento, sua proxima transação podera ser processada. Transação idêntica já foi criada recentemente.',
                        transactionId: existingTransactionId,
                        transaction: TransactionResponseDto.fromEntity(existingTransaction),
                    });
                }
            }

            const receiver = await this.usersRepository.findByEmail(
                createTransactionDto.receiverEmail,
            );

            if (!receiver) {
                throw new BadRequestException(
                    'Usuário destinatário não encontrado',
                );
            }

            if (receiver.id === senderId) {
                throw new BadRequestException(
                    'Não é possível enviar transação para si mesmo',
                );
            }

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

            const transaction = await this.transactionsRepository.create({
                senderId,
                receiverId: receiver.id,
                amount: createTransactionDto.amount,
                paymentMethod: createTransactionDto.paymentMethod,
                status: TransactionStatus.PENDING,
            });

            await this.cacheService.setIdempotency(idempotencyKey, transaction.id, 60);

            const fullTransaction = await this.transactionsRepository.findById(
                transaction.id,
            );

            await this.cacheService.set(
                `transaction:${transaction.id}`,
                TransactionResponseDto.fromEntity(fullTransaction!),
                60,
            );

            await this.cacheService.delPattern(`transactions:user:${senderId}*`);
            await this.cacheService.delPattern(`transactions:user:${receiver.id}*`);

            this.rabbitClient.emit('transaction.created', {
                transactionId: transaction.id,
                senderId: transaction.senderId,
                receiverId: transaction.receiverId,
                amount: transaction.amount,
                paymentMethod: transaction.paymentMethod,
            });

            this.metricsService.recordMessagePublished();

            await this.logsService.logTransactionCreated(transaction.id!, senderId, 201);

            return TransactionResponseDto.fromEntity(fullTransaction!);
        } catch (error) {
            await this.logsService.logErrorWithStack(
                error,
                'TransactionsService.create',
                senderId,
                {
                    receiverEmail: createTransactionDto.receiverEmail,
                    amount: createTransactionDto.amount,
                    paymentMethod: createTransactionDto.paymentMethod,
                }
            );
            throw error;
        }
    }

    async findAll(
        userId: string,
        paginationQuery: PaginationQueryDto,
    ): Promise<PaginatedResponseDto> {
        const page = paginationQuery.page || 1;
        const limit = paginationQuery.limit || 10;

        const cacheKey = `transactions:user:${userId}:page:${page}:limit:${limit}`;
        const cached = await this.cacheService.get<PaginatedResponseDto>(cacheKey);
        if (cached) {
            return cached;
        }

        const { data, total } = await this.transactionsRepository.findByUserIdWithPagination(
            userId,
            page,
            limit,
        );
        const transactionsDto = data.map(TransactionResponseDto.fromEntity);
        const response = new PaginatedResponseDto(transactionsDto, total, page, limit);

        await this.cacheService.set(cacheKey, response, 30);

        return response;
    }

    async findById(id: string, userId: string): Promise<TransactionResponseDto> {

        const cached = await this.cacheService.get<TransactionResponseDto>(`transaction:${id}`);
        if (cached) {
            if (cached.senderId !== userId && cached.receiverId !== userId) {
                throw new NotFoundException('Transação não encontrada');
            }
            return cached;
        }

        const transaction = await this.transactionsRepository.findById(id);

        if (!transaction) {
            throw new NotFoundException('Transação não encontrada');
        }

        if (transaction.senderId !== userId && transaction.receiverId !== userId) {
            throw new NotFoundException('Transação não encontrada');
        }

        const response = TransactionResponseDto.fromEntity(transaction);

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


        await this.cacheService.del(`transaction:${id}`);
        await this.cacheService.del(`transactions:user:${transaction.senderId}`);
        await this.cacheService.del(`transactions:user:${transaction.receiverId}`);

        const updatedTransaction = await this.transactionsRepository.findById(id);

        return TransactionResponseDto.fromEntity(updatedTransaction!);
    }

    async findAllForAdmin(
        paginationQuery: PaginationQueryDto,
    ): Promise<PaginatedResponseDto> {
        const page = paginationQuery.page || 1;
        const limit = paginationQuery.limit || 10;

        // Verificar cache para admin
        const cacheKey = `transactions:admin:page:${page}:limit:${limit}`;
        const cached = await this.cacheService.get<PaginatedResponseDto>(cacheKey);
        if (cached) {
            return cached;
        }

        const { data, total } = await this.transactionsRepository.findAllWithPagination(
            page,
            limit,
        );
        const transactionsDto = data.map(TransactionResponseDto.fromEntity);
        const response = new PaginatedResponseDto(transactionsDto, total, page, limit);

        await this.cacheService.set(cacheKey, response, 30);

        return response;
    }
}
