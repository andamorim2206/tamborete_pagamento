import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TransactionsRepository } from './transactions.repository';
import { UsersRepository } from '../users/users.repository';
import { TransactionStatus } from './enums/transaction-status.enum';
import { CacheService } from '../cache/cache.service';
import { MetricsService } from '../metrics/metrics.service';

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

        // CONTROLE DE CONCORRÊNCIA: Tentar adquirir lock distribuído
        const lockAcquired = await this.cacheService.acquireLock(lockKey, 60);

        if (!lockAcquired) {
            this.logger.warn(
                `⚠️ Transação ${data.transactionId} já está sendo processada por outro worker. Ignorando...`,
            );
            return;
        }

        let success = false;

        try {
            // 1. Atualizar status para PROCESSING
            await this.transactionsRepository.updateStatus(
                data.transactionId,
                TransactionStatus.PROCESSING,
            );
            this.logger.log(`⏳ Transação ${data.transactionId} em processamento...`);

            // Invalidar cache da transação e das listas
            await this.cacheService.del(`transaction:${data.transactionId}`);
            await this.cacheService.del(`transactions:user:${data.senderId}`);
            await this.cacheService.del(`transactions:user:${data.receiverId}`);

            // 2. Simular processamento (validações, chamadas externas, etc)
            // Em um cenário real, aqui você faria:
            // - Validação de saldo
            // - Chamadas para APIs de pagamento (PIX, Cartão)
            // - Regras de negócio complexas
            await this.simulateProcessing();

            // 3. Realizar transferência de saldo
            // Debitar do sender e creditar ao receiver
            this.logger.log(
                `💰 Transferindo R$ ${data.amount.toFixed(2)} de ${data.senderId} para ${data.receiverId}`,
            );

            await this.usersRepository.debitBalance(data.senderId, data.amount);
            await this.usersRepository.creditBalance(data.receiverId, data.amount);

            this.logger.log(`✅ Saldos atualizados com sucesso!`);

            // 4. Atualizar status para COMPLETED
            await this.transactionsRepository.updateStatus(
                data.transactionId,
                TransactionStatus.COMPLETED,
            );
            this.logger.log(`✅ Transação ${data.transactionId} completada com sucesso!`);

            success = true;

            // Invalidar cache da transação e das listas de transações dos usuários
            await this.cacheService.del(`transaction:${data.transactionId}`);
            await this.cacheService.del(`transactions:user:${data.senderId}`);
            await this.cacheService.del(`transactions:user:${data.receiverId}`);

        } catch (error) {
            // 5. Se der erro, marca como FAILED
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            this.logger.error(
                `❌ Erro ao processar transação ${data.transactionId}: ${errorMessage}`,
            );
            await this.transactionsRepository.updateStatus(
                data.transactionId,
                TransactionStatus.FAILED,
            );

            success = false;

            // Invalidar cache
            await this.cacheService.del(`transaction:${data.transactionId}`);
            await this.cacheService.del(`transactions:user:${data.senderId}`);
            await this.cacheService.del(`transactions:user:${data.receiverId}`);
        } finally {
            // Registrar métrica de processamento
            const processingTime = Date.now() - startTime;
            this.metricsService.recordMessageConsumed(processingTime, success);

            // Liberar lock SEMPRE, mesmo em caso de erro
            await this.cacheService.releaseLock(lockKey);
            this.logger.log(`🔓 Lock liberado para transação ${data.transactionId}`);
        }
    }

    private async simulateProcessing(): Promise<void> {
        // Simula um processamento de 3 segundos
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 3000);
        });
    }
}
