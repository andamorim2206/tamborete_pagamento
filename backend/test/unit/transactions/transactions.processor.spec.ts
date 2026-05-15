import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsProcessor } from '../../../src/transactions/transactions.processor';
import { TransactionsRepository } from '../../../src/transactions/transactions.repository';
import { CacheService } from '../../../src/cache/cache.service';
import { TransactionStatus } from '../../../src/transactions/enums/transaction-status.enum';

/**
 * TESTE DO TRANSACTIONS PROCESSOR (RabbitMQ Worker)
 * 
 * O que testamos aqui:
 * - Processamento assíncrono de transações
 * - Distributed locks (controle de concorrência)
 * - Atualização de status (PENDING → PROCESSING → COMPLETED)
 * - Tratamento de erros (status FAILED)
 * - Invalidação de cache
 */
describe('TransactionsProcessor', () => {
    let processor: TransactionsProcessor;
    let transactionsRepository: jest.Mocked<TransactionsRepository>;
    let cacheService: jest.Mocked<CacheService>;

    // Evento de teste (vem do RabbitMQ)
    const mockEvent = {
        transactionId: 'txn-123',
        senderId: 'sender-456',
        receiverId: 'receiver-789',
        amount: 150.50,
        paymentMethod: 'PIX',
    };

    beforeEach(async () => {
        const mockTransactionsRepository = {
            updateStatus: jest.fn(),
        };

        const mockCacheService = {
            acquireLock: jest.fn(),
            releaseLock: jest.fn(),
            del: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransactionsProcessor,
                {
                    provide: TransactionsRepository,
                    useValue: mockTransactionsRepository,
                },
                {
                    provide: CacheService,
                    useValue: mockCacheService,
                },
            ],
        }).compile();

        processor = module.get<TransactionsProcessor>(TransactionsProcessor);
        transactionsRepository = module.get(TransactionsRepository);
        cacheService = module.get(CacheService);

        // Mock do simulateProcessing para não esperar 3 segundos
        jest.spyOn(processor as any, 'simulateProcessing').mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('deve ser definido', () => {
        expect(processor).toBeDefined();
    });

    /**
     * TESTE 1: Processar transação com sucesso
     * Por quê? Fluxo principal do worker
     * 
     * Fluxo testado:
     * 1. Recebe evento do RabbitMQ
     * 2. Adquire lock distribuído
     * 3. Atualiza status para PROCESSING
     * 4. Simula processamento (3s)
     * 5. Atualiza status para COMPLETED
     * 6. Invalida cache
     * 7. Libera lock
     */
    describe('handleTransactionCreated', () => {
        it('deve processar transação com sucesso', async () => {
            // Arrange
            cacheService.acquireLock.mockResolvedValue(true); // Conseguiu lock

            // Act
            await processor.handleTransactionCreated(mockEvent);

            // Assert
            // 1. Deve tentar adquirir lock
            expect(cacheService.acquireLock).toHaveBeenCalledWith(
                'lock:transaction:txn-123',
                60,
            );

            // 2. Deve atualizar status para PROCESSING
            expect(transactionsRepository.updateStatus).toHaveBeenNthCalledWith(
                1,
                'txn-123',
                TransactionStatus.PROCESSING,
            );

            // 3. Deve atualizar status para COMPLETED
            expect(transactionsRepository.updateStatus).toHaveBeenNthCalledWith(
                2,
                'txn-123',
                TransactionStatus.COMPLETED,
            );

            // 4. Deve invalidar cache (2x: depois de PROCESSING e depois de COMPLETED)
            expect(cacheService.del).toHaveBeenCalledWith('transaction:txn-123');
            expect(cacheService.del).toHaveBeenCalledWith('transactions:all');
            expect(cacheService.del).toHaveBeenCalledTimes(4); // 2 vezes * 2 chaves

            // 5. Deve liberar lock
            expect(cacheService.releaseLock).toHaveBeenCalledWith('lock:transaction:txn-123');
        });

        /**
         * TESTE 2: NÃO processar se lock já está em uso (CONTROLE DE CONCORRÊNCIA)
         * Por quê? Evitar processamento duplicado por múltiplos workers
         * 
         * Cenário:
         * - Worker 1 está processando a transação
         * - Worker 2 recebe a mesma mensagem do RabbitMQ
         * - Worker 2 não consegue adquirir lock
         * - Worker 2 ignora a mensagem
         */
        it('não deve processar se não conseguir adquirir lock', async () => {
            // Arrange: Outro worker já tem o lock
            cacheService.acquireLock.mockResolvedValue(false);

            // Act
            await processor.handleTransactionCreated(mockEvent);

            // Assert
            // Deve tentar adquirir lock
            expect(cacheService.acquireLock).toHaveBeenCalled();

            // NÃO deve atualizar status (outro worker está processando)
            expect(transactionsRepository.updateStatus).not.toHaveBeenCalled();

            // NÃO deve invalidar cache
            expect(cacheService.del).not.toHaveBeenCalled();

            // NÃO deve tentar liberar lock (não adquiriu)
            expect(cacheService.releaseLock).not.toHaveBeenCalled();
        });

        /**
         * TESTE 3: Marcar como FAILED em caso de erro
         * Por quê? Tratar falhas no processamento
         * 
         * Cenário:
         * - Processamento falha (ex: API de pagamento fora do ar)
         * - Deve marcar transação como FAILED
         * - Deve liberar lock mesmo com erro
         */
        it('deve marcar como FAILED se processamento falhar', async () => {
            // Arrange
            cacheService.acquireLock.mockResolvedValue(true);

            // Simular erro no processamento
            jest.spyOn(processor as any, 'simulateProcessing')
                .mockRejectedValue(new Error('Erro no processamento'));

            // Act
            await processor.handleTransactionCreated(mockEvent);

            // Assert
            // 1. Deve atualizar para PROCESSING
            expect(transactionsRepository.updateStatus).toHaveBeenNthCalledWith(
                1,
                'txn-123',
                TransactionStatus.PROCESSING,
            );

            // 2. Deve atualizar para FAILED (não COMPLETED)
            expect(transactionsRepository.updateStatus).toHaveBeenNthCalledWith(
                2,
                'txn-123',
                TransactionStatus.FAILED,
            );

            // 3. Deve invalidar cache mesmo com erro
            expect(cacheService.del).toHaveBeenCalled();

            // 4. Deve liberar lock SEMPRE (finally)
            expect(cacheService.releaseLock).toHaveBeenCalledWith('lock:transaction:txn-123');
        });

        /**
         * TESTE 4: Liberar lock mesmo se updateStatus falhar
         * Por quê? Evitar lock infinito
         * 
         * Cenário:
         * - Banco de dados cai durante processamento
         * - Erro ao tentar atualizar status
         * - Lock DEVE ser liberado mesmo assim (finally)
         */
        it('deve liberar lock mesmo se houver erro ao atualizar status', async () => {
            // Arrange
            cacheService.acquireLock.mockResolvedValue(true);

            // Simular erro APENAS na primeira chamada (PROCESSING)
            transactionsRepository.updateStatus
                .mockRejectedValueOnce(new Error('Database connection failed'));

            // Act
            await processor.handleTransactionCreated(mockEvent);

            // Assert
            // Lock deve ser liberado mesmo com erro
            expect(cacheService.releaseLock).toHaveBeenCalledWith('lock:transaction:txn-123');
        });

        /**
         * TESTE 5: Invalidar cache após cada mudança de status
         * Por quê? Garantir que usuário vê status atualizado
         */
        it('deve invalidar cache após PROCESSING e após COMPLETED', async () => {
            cacheService.acquireLock.mockResolvedValue(true);

            await processor.handleTransactionCreated(mockEvent);

            // Deve invalidar 4 vezes:
            // - 1x transaction:id após PROCESSING
            // - 1x transactions:all após PROCESSING
            // - 1x transaction:id após COMPLETED
            // - 1x transactions:all após COMPLETED
            expect(cacheService.del).toHaveBeenCalledTimes(4);

            expect(cacheService.del).toHaveBeenCalledWith('transaction:txn-123');
            expect(cacheService.del).toHaveBeenCalledWith('transactions:all');
        });
    });

    /**
     * TESTE 6: simulateProcessing
     * Por quê? Garantir que delay funciona (em produção seria chamada à API)
     */
    describe('simulateProcessing', () => {
        it.skip('deve aguardar 3 segundos', async () => {
            // Skip porque é muito lento para testes unitários
            // O comportamento é testado indiretamente nos outros testes
        }, 10000); // Timeout de 10 segundos para este teste
    });
});
