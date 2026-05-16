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
var TransactionsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsProcessor = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const transactions_repository_1 = require("./transactions.repository");
const users_repository_1 = require("../users/users.repository");
const transaction_status_enum_1 = require("./enums/transaction-status.enum");
const cache_service_1 = require("../cache/cache.service");
const metrics_service_1 = require("../metrics/metrics.service");
let TransactionsProcessor = TransactionsProcessor_1 = class TransactionsProcessor {
    transactionsRepository;
    usersRepository;
    cacheService;
    metricsService;
    logger = new common_1.Logger(TransactionsProcessor_1.name);
    constructor(transactionsRepository, usersRepository, cacheService, metricsService) {
        this.transactionsRepository = transactionsRepository;
        this.usersRepository = usersRepository;
        this.cacheService = cacheService;
        this.metricsService = metricsService;
    }
    async handleTransactionCreated(data) {
        const startTime = Date.now();
        const lockKey = `lock:transaction:${data.transactionId}`;
        this.logger.log(`📨 Recebendo transação para processar: ${data.transactionId}`);
        const lockAcquired = await this.cacheService.acquireLock(lockKey, 60);
        if (!lockAcquired) {
            this.logger.warn(`⚠️ Transação ${data.transactionId} já está sendo processada por outro worker. Ignorando...`);
            return;
        }
        let success = false;
        try {
            await this.transactionsRepository.updateStatus(data.transactionId, transaction_status_enum_1.TransactionStatus.PROCESSING);
            this.logger.log(`⏳ Transação ${data.transactionId} em processamento...`);
            await this.cacheService.del(`transaction:${data.transactionId}`);
            await this.cacheService.del(`transactions:user:${data.senderId}`);
            await this.cacheService.del(`transactions:user:${data.receiverId}`);
            await this.simulateProcessing();
            this.logger.log(`💰 Transferindo R$ ${data.amount.toFixed(2)} de ${data.senderId} para ${data.receiverId}`);
            await this.usersRepository.debitBalance(data.senderId, data.amount);
            await this.usersRepository.creditBalance(data.receiverId, data.amount);
            this.logger.log(`✅ Saldos atualizados com sucesso!`);
            await this.transactionsRepository.updateStatus(data.transactionId, transaction_status_enum_1.TransactionStatus.COMPLETED);
            this.logger.log(`✅ Transação ${data.transactionId} completada com sucesso!`);
            success = true;
            await this.cacheService.del(`transaction:${data.transactionId}`);
            await this.cacheService.del(`transactions:user:${data.senderId}`);
            await this.cacheService.del(`transactions:user:${data.receiverId}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            this.logger.error(`❌ Erro ao processar transação ${data.transactionId}: ${errorMessage}`);
            await this.transactionsRepository.updateStatus(data.transactionId, transaction_status_enum_1.TransactionStatus.FAILED);
            success = false;
            await this.cacheService.del(`transaction:${data.transactionId}`);
            await this.cacheService.del(`transactions:user:${data.senderId}`);
            await this.cacheService.del(`transactions:user:${data.receiverId}`);
        }
        finally {
            const processingTime = Date.now() - startTime;
            this.metricsService.recordMessageConsumed(processingTime, success);
            await this.cacheService.releaseLock(lockKey);
            this.logger.log(`🔓 Lock liberado para transação ${data.transactionId}`);
        }
    }
    async simulateProcessing() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 3000);
        });
    }
};
exports.TransactionsProcessor = TransactionsProcessor;
__decorate([
    (0, microservices_1.EventPattern)('transaction.created'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsProcessor.prototype, "handleTransactionCreated", null);
exports.TransactionsProcessor = TransactionsProcessor = TransactionsProcessor_1 = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [transactions_repository_1.TransactionsRepository,
        users_repository_1.UsersRepository,
        cache_service_1.CacheService,
        metrics_service_1.MetricsService])
], TransactionsProcessor);
//# sourceMappingURL=transactions.processor.js.map