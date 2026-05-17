import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TransactionsRepository } from './transactions.repository';
import { UsersRepository } from '../users/users.repository';
import { TransactionStatus } from './enums/transaction-status.enum';
import { CacheService } from '../cache/cache.service';
import { MetricsService } from '../metrics/metrics.service';
import { LogsService } from '../logs/logs.service';

interface TransactionCreatedEvent {
    transactionId: string;
    senderId: string;
    receiverId: string;
    amount: number;
    paymentMethod: string;
}

@Controller()
export class TransactionsProcessor {
    private readonly logger = new Logger(TransactionsProcessor.name);

    constructor(
        private readonly transactionsRepository: TransactionsRepository,
        private readonly usersRepository: UsersRepository,
        private readonly cacheService: CacheService,
        private readonly metricsService: MetricsService,
        private readonly logsService: LogsService,
    ) { }

    @EventPattern('transaction.created')
    async handleTransactionCreated(
        @Payload() data: TransactionCreatedEvent,
    ): Promise<void> {
        const startTime = Date.now();
        const lockKey = `lock:transaction:${data.transactionId}`;

        this.logger.log(
            `📨 Recebendo transação para processar: ${data.transactionId}`,
        );

        const lockAcquired = await this.cacheService.acquireLock(lockKey, 60);

        if (!lockAcquired) {
            this.logger.warn(
                `⚠️ Transação ${data.transactionId} já está sendo processada por outro worker. Ignorando...`,
            );
            await this.logsService.logRabbitMQError(
                `Lock não adquirido para transação ${data.transactionId}`,
                { transactionId: data.transactionId },
            );
            return;
        }

        let success = false;

        try {
            await this.transactionsRepository.updateStatus(
                data.transactionId,
                TransactionStatus.PROCESSING,
            );
            this.logger.log(`⏳ Transação ${data.transactionId} em processamento...`);
            await this.logsService.logTransactionProcessing(data.transactionId, data.senderId);

            await this.cacheService.del(`transaction:${data.transactionId}`);
            await this.cacheService.delPattern(`transactions:user:${data.senderId}*`);
            await this.cacheService.delPattern(`transactions:user:${data.receiverId}*`);

            await this.simulateProcessing();

            this.logger.log(
                `💰 Transferindo R$ ${data.amount.toFixed(2)} de ${data.senderId} para ${data.receiverId}`,
            );

            await this.usersRepository.debitBalance(data.senderId, data.amount);
            await this.usersRepository.creditBalance(data.receiverId, data.amount);

            this.logger.log(`✅ Saldos atualizados com sucesso!`);

            await this.transactionsRepository.updateStatus(
                data.transactionId,
                TransactionStatus.COMPLETED,
            );
            this.logger.log(`✅ Transação ${data.transactionId} completada com sucesso!`);
            await this.logsService.logTransactionCompleted(data.transactionId, data.senderId);
            await this.logsService.logRabbitMQSuccess(
                `Transação ${data.transactionId} processada com sucesso`,
                { transactionId: data.transactionId, amount: data.amount },
            );

            success = true;

            await this.cacheService.del(`transaction:${data.transactionId}`);
            await this.cacheService.delPattern(`transactions:user:${data.senderId}*`);
            await this.cacheService.delPattern(`transactions:user:${data.receiverId}*`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            const stackTrace = error instanceof Error ? error.stack : undefined;

            this.logger.error(
                `Erro ao processar transação ${data.transactionId}: ${errorMessage}`,
            );

            await this.transactionsRepository.updateStatus(
                data.transactionId,
                TransactionStatus.FAILED,
            );

            // Log detalhado de erro com stack trace
            await this.logsService.logErrorWithStack(
                error,
                'TransactionsProcessor.handleTransactionCreated',
                data.senderId,
                {
                    transactionId: data.transactionId,
                    receiverId: data.receiverId,
                    amount: data.amount,
                    paymentMethod: data.paymentMethod,
                }
            );

            await this.logsService.logTransactionFailed(data.transactionId, data.senderId, errorMessage);
            await this.logsService.logRabbitMQError(
                `Erro ao processar transação ${data.transactionId}: ${errorMessage}`,
                {
                    transactionId: data.transactionId,
                    error: errorMessage,
                    stackTrace,
                    context: 'RabbitMQ Transaction Processing',
                },
            );

            success = false;

            await this.cacheService.del(`transaction:${data.transactionId}`);
            await this.cacheService.delPattern(`transactions:user:${data.senderId}*`);
            await this.cacheService.delPattern(`transactions:user:${data.receiverId}*`);
        } finally {
            const processingTime = Date.now() - startTime;
            this.metricsService.recordMessageConsumed(processingTime, success);

            await this.cacheService.releaseLock(lockKey);
            this.logger.log(` Lock liberado para transação ${data.transactionId}`);
        }
    }

    private async simulateProcessing(): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 3000);
        });
    }
}
