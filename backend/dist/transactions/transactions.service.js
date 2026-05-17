"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const transactions_repository_1 = require("./transactions.repository");
const users_repository_1 = require("../users/users.repository");
const transaction_response_dto_1 = require("./dto/transaction-response.dto");
const paginated_response_dto_1 = require("./dto/paginated-response.dto");
const transaction_status_enum_1 = require("./enums/transaction-status.enum");
const cache_service_1 = require("../cache/cache.service");
const metrics_service_1 = require("../metrics/metrics.service");
const logs_service_1 = require("../logs/logs.service");
let TransactionsService = class TransactionsService {
    transactionsRepository;
    usersRepository;
    cacheService;
    metricsService;
    logsService;
    rabbitClient;
    constructor(transactionsRepository, usersRepository, cacheService, metricsService, logsService, rabbitClient) {
        this.transactionsRepository = transactionsRepository;
        this.usersRepository = usersRepository;
        this.cacheService = cacheService;
        this.metricsService = metricsService;
        this.logsService = logsService;
        this.rabbitClient = rabbitClient;
    }
    async create(senderId, createTransactionDto) {
        try {
            const idempotencyKey = `idempotency:${senderId}:${createTransactionDto.receiverEmail}:${createTransactionDto.amount}:${createTransactionDto.paymentMethod}`;
            const existingTransactionId = await this.cacheService.checkIdempotency(idempotencyKey);
            if (existingTransactionId) {
                const existingTransaction = await this.transactionsRepository.findById(existingTransactionId);
                if (existingTransaction) {
                    throw new common_1.ConflictException({
                        message: 'Espere um momento, sua proxima transação podera ser processada. Transação idêntica já foi criada recentemente.',
                        transactionId: existingTransactionId,
                        transaction: transaction_response_dto_1.TransactionResponseDto.fromEntity(existingTransaction),
                    });
                }
            }
            const receiver = await this.usersRepository.findByEmail(createTransactionDto.receiverEmail);
            if (!receiver) {
                throw new common_1.BadRequestException('Usuário destinatário não encontrado');
            }
            if (receiver.id === senderId) {
                throw new common_1.BadRequestException('Não é possível enviar transação para si mesmo');
            }
            const sender = await this.usersRepository.findById(senderId);
            if (!sender) {
                throw new common_1.BadRequestException('Usuário remetente não encontrado');
            }
            const senderBalance = Number(sender.balance) || 0;
            if (senderBalance < createTransactionDto.amount) {
                throw new common_1.BadRequestException(`Saldo insuficiente. Saldo disponível: R$ ${senderBalance.toFixed(2)}`);
            }
            const transaction = await this.transactionsRepository.create({
                senderId,
                receiverId: receiver.id,
                amount: createTransactionDto.amount,
                paymentMethod: createTransactionDto.paymentMethod,
                status: transaction_status_enum_1.TransactionStatus.PENDING,
            });
            await this.cacheService.setIdempotency(idempotencyKey, transaction.id, 60);
            const fullTransaction = await this.transactionsRepository.findById(transaction.id);
            await this.cacheService.set(`transaction:${transaction.id}`, transaction_response_dto_1.TransactionResponseDto.fromEntity(fullTransaction), 60);
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
            await this.logsService.logTransactionCreated(transaction.id, senderId, 201);
            return transaction_response_dto_1.TransactionResponseDto.fromEntity(fullTransaction);
        }
        catch (error) {
            await this.logsService.logErrorWithStack(error, 'TransactionsService.create', senderId, {
                receiverEmail: createTransactionDto.receiverEmail,
                amount: createTransactionDto.amount,
                paymentMethod: createTransactionDto.paymentMethod,
            });
            throw error;
        }
    }
    async findAll(userId, paginationQuery) {
        const page = paginationQuery.page || 1;
        const limit = paginationQuery.limit || 10;
        const cacheKey = `transactions:user:${userId}:page:${page}:limit:${limit}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        const { data, total } = await this.transactionsRepository.findByUserIdWithPagination(userId, page, limit);
        const transactionsDto = data.map(transaction_response_dto_1.TransactionResponseDto.fromEntity);
        const response = new paginated_response_dto_1.PaginatedResponseDto(transactionsDto, total, page, limit);
        await this.cacheService.set(cacheKey, response, 30);
        return response;
    }
    async findById(id, userId) {
        const cached = await this.cacheService.get(`transaction:${id}`);
        if (cached) {
            if (cached.senderId !== userId && cached.receiverId !== userId) {
                throw new common_1.NotFoundException('Transação não encontrada');
            }
            return cached;
        }
        const transaction = await this.transactionsRepository.findById(id);
        if (!transaction) {
            throw new common_1.NotFoundException('Transação não encontrada');
        }
        if (transaction.senderId !== userId && transaction.receiverId !== userId) {
            throw new common_1.NotFoundException('Transação não encontrada');
        }
        const response = transaction_response_dto_1.TransactionResponseDto.fromEntity(transaction);
        await this.cacheService.set(`transaction:${id}`, response, 60);
        return response;
    }
    async updateStatus(id, updateStatusDto) {
        const transaction = await this.transactionsRepository.findById(id);
        if (!transaction) {
            throw new common_1.NotFoundException('Transação não encontrada');
        }
        await this.transactionsRepository.updateStatus(id, updateStatusDto.status);
        await this.cacheService.del(`transaction:${id}`);
        await this.cacheService.del(`transactions:user:${transaction.senderId}`);
        await this.cacheService.del(`transactions:user:${transaction.receiverId}`);
        const updatedTransaction = await this.transactionsRepository.findById(id);
        return transaction_response_dto_1.TransactionResponseDto.fromEntity(updatedTransaction);
    }
    async findAllForAdmin(paginationQuery) {
        const page = paginationQuery.page || 1;
        const limit = paginationQuery.limit || 10;
        const cacheKey = `transactions:admin:page:${page}:limit:${limit}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        const { data, total } = await this.transactionsRepository.findAllWithPagination(page, limit);
        const transactionsDto = data.map(transaction_response_dto_1.TransactionResponseDto.fromEntity);
        const response = new paginated_response_dto_1.PaginatedResponseDto(transactionsDto, total, page, limit);
        await this.cacheService.set(cacheKey, response, 30);
        return response;
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(5, (0, common_1.Inject)('RABBITMQ_SERVICE')),
    __metadata("design:paramtypes", [transactions_repository_1.TransactionsRepository,
        users_repository_1.UsersRepository,
        cache_service_1.CacheService,
        metrics_service_1.MetricsService,
        logs_service_1.LogsService,
        microservices_1.ClientProxy])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map