import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionsService } from '../../../src/transactions/transactions.service';
import { TransactionsRepository } from '../../../src/transactions/transactions.repository';
import { UsersRepository } from '../../../src/users/users.repository';
import { CacheService } from '../../../src/cache/cache.service';
import { MetricsService } from '../../../src/metrics/metrics.service';
import { PaymentMethod } from '../../../src/transactions/enums/payment-method.enum';
import { TransactionStatus } from '../../../src/transactions/enums/transaction-status.enum';

/**
 * TESTE DO TRANSACTIONS SERVICE
 * 
 * O que testamos aqui:
 * - Criação de transações (com todas as validações)
 * - Idempotência (detectar duplicatas)
 * - Cache de consultas
 * - Integração com Redis e RabbitMQ
 * - Tratamento de erros
 */
describe('TransactionsService', () => {
    let service: TransactionsService;
    let transactionsRepository: jest.Mocked<TransactionsRepository>;
    let usersRepository: jest.Mocked<UsersRepository>;
    let cacheService: jest.Mocked<CacheService>;
    let rabbitClient: any;

    // Dados de teste
    const mockSender = {
        id: 'sender-123',
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockReceiver = {
        id: 'receiver-456',
        name: 'Maria Santos',
        email: 'maria@example.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockTransaction = {
        id: 'txn-789',
        senderId: mockSender.id,
        sender: mockSender,
        receiverId: mockReceiver.id,
        receiver: mockReceiver,
        amount: 100.50,
        paymentMethod: PaymentMethod.PIX,
        status: TransactionStatus.PENDING,
        createdAt: new Date(),
    };

    beforeEach(async () => {
        // Criar mocks de todos os serviços
        const mockTransactionsRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            findByUserId: jest.fn(),
            updateStatus: jest.fn(),
        };

        const mockUsersRepository = {
            findByEmail: jest.fn(),
            findById: jest.fn(),
        };

        const mockCacheService = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            checkIdempotency: jest.fn(),
            setIdempotency: jest.fn(),
        };

        const mockMetricsService = {
            recordRedisOperation: jest.fn(),
            recordMessagePublished: jest.fn(),
            recordMessageConsumed: jest.fn(),
            recordApiRequest: jest.fn(),
        };

        const mockRabbitClient = {
            emit: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransactionsService,
                {
                    provide: TransactionsRepository,
                    useValue: mockTransactionsRepository,
                },
                {
                    provide: UsersRepository,
                    useValue: mockUsersRepository,
                },
                {
                    provide: CacheService,
                    useValue: mockCacheService,
                },
                {
                    provide: MetricsService,
                    useValue: mockMetricsService,
                },
                {
                    provide: 'RABBITMQ_SERVICE',
                    useValue: mockRabbitClient,
                },
            ],
        }).compile();

        service = module.get<TransactionsService>(TransactionsService);
        transactionsRepository = module.get(TransactionsRepository);
        usersRepository = module.get(UsersRepository);
        cacheService = module.get(CacheService);
        rabbitClient = module.get('RABBITMQ_SERVICE');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('deve ser definido', () => {
        expect(service).toBeDefined();
    });

    /**
     * TESTE 1: Criar transação com sucesso
     * Por quê? Fluxo principal do sistema
     * 
     * Fluxo testado:
     * 1. Verifica idempotência (não existe)
     * 2. Busca receiver por email
     * 3. Valida que não está enviando para si mesmo
     * 4. Cria transação no banco
     * 5. Marca como processada no Redis
     * 6. Cacheia transação
     * 7. Publica no RabbitMQ
     */
    describe('create', () => {
        const createDto = {
            receiverEmail: 'maria@example.com',
            amount: 100.50,
            paymentMethod: PaymentMethod.PIX,
        };

        it('deve criar transação com sucesso', async () => {
            // Arrange (preparar)
            cacheService.checkIdempotency.mockResolvedValue(null); // Não há duplicata
            usersRepository.findByEmail.mockResolvedValue(mockReceiver);
            usersRepository.findById.mockResolvedValue({ ...mockSender, balance: 1000 }); // Sender com saldo
            transactionsRepository.create.mockResolvedValue(mockTransaction as any);
            transactionsRepository.findById.mockResolvedValue(mockTransaction as any);

            // Act (executar)
            const result = await service.create(mockSender.id, createDto);

            // Assert (verificar)
            expect(result).toBeDefined();
            expect(result.id).toBe(mockTransaction.id);
            expect(result.amount).toBe(100.50);
            expect(result.status).toBe(TransactionStatus.PENDING);

            // Verificar que idempotência foi checada
            expect(cacheService.checkIdempotency).toHaveBeenCalledWith(
                expect.stringContaining('idempotency:sender-123:maria@example.com:100.5:PIX'),
            );

            // Verificar que receiver foi buscado
            expect(usersRepository.findByEmail).toHaveBeenCalledWith('maria@example.com');

            // Verificar que transação foi criada
            expect(transactionsRepository.create).toHaveBeenCalledWith({
                senderId: mockSender.id,
                receiverId: mockReceiver.id,
                amount: 100.50,
                paymentMethod: PaymentMethod.PIX,
                status: TransactionStatus.PENDING,
            });

            // Verificar que foi cacheada
            expect(cacheService.set).toHaveBeenCalledWith(
                `transaction:${mockTransaction.id}`,
                expect.any(Object),
                60,
            );

            // Verificar que foi publicado no RabbitMQ
            expect(rabbitClient.emit).toHaveBeenCalledWith('transaction.created', {
                transactionId: mockTransaction.id,
                senderId: mockSender.id,
                receiverId: mockReceiver.id,
                amount: 100.50,
                paymentMethod: PaymentMethod.PIX,
            });
        });

        /**
         * TESTE 2: Detectar transação duplicada (IDEMPOTÊNCIA)
         * Por quê? Evitar cobranças duplicadas
         */
        it('deve detectar transação duplicada e retornar 409', async () => {
            // Arrange: Simular que transação já existe
            cacheService.checkIdempotency.mockResolvedValue('txn-existing');
            transactionsRepository.findById.mockResolvedValue(mockTransaction as any);

            // Act & Assert
            await expect(
                service.create(mockSender.id, createDto),
            ).rejects.toThrow(ConflictException);

            // Verificar que NÃO tentou criar nova transação
            expect(transactionsRepository.create).not.toHaveBeenCalled();
            expect(rabbitClient.emit).not.toHaveBeenCalled();
        });

        /**
         * TESTE 3: Receiver não encontrado
         * Por quê? Validar que destinatário existe
         */
        it('deve retornar erro 400 se receiver não existe', async () => {
            cacheService.checkIdempotency.mockResolvedValue(null);
            usersRepository.findByEmail.mockResolvedValue(null); // Não encontrou

            await expect(
                service.create(mockSender.id, createDto),
            ).rejects.toThrow(BadRequestException);

            expect(transactionsRepository.create).not.toHaveBeenCalled();
        });

        /**
         * TESTE 4: Não pode enviar para si mesmo
         * Por quê? Regra de negócio
         */
        it('deve retornar erro 400 se tentar enviar para si mesmo', async () => {
            cacheService.checkIdempotency.mockResolvedValue(null);
            // Retornar o próprio sender como receiver
            usersRepository.findByEmail.mockResolvedValue(mockSender);

            await expect(
                service.create(mockSender.id, createDto),
            ).rejects.toThrow(BadRequestException);

            expect(transactionsRepository.create).not.toHaveBeenCalled();
        });
    });

    /**
     * TESTE 5: Listar todas as transações (COM CACHE)
     * Por quê? Validar que cache funciona
     */
    describe('findAll', () => {
        const userId = 'user-123';

        it('deve retornar do cache se existir', async () => {
            const cachedData = [
                { id: 'txn-1', amount: 50 },
                { id: 'txn-2', amount: 100 },
            ];

            cacheService.get.mockResolvedValue(cachedData as any);

            const result = await service.findAll(userId);

            expect(result).toEqual(cachedData);
            // Não deve buscar no banco se tem cache
            expect(transactionsRepository.findByUserId).not.toHaveBeenCalled();
        });

        /**
         * TESTE 6: Buscar no banco e cachear
         * Por quê? CACHE MISS - primeira busca
         */
        it('deve buscar no banco e cachear se não existe no cache', async () => {
            cacheService.get.mockResolvedValue(null); // Cache vazio
            transactionsRepository.findByUserId.mockResolvedValue([mockTransaction] as any);

            const result = await service.findAll(userId);

            expect(result).toBeDefined();
            expect(result.length).toBeGreaterThan(0);

            // Deve buscar no banco com userId
            expect(transactionsRepository.findByUserId).toHaveBeenCalledWith(userId);

            // Deve cachear o resultado com chave específica do usuário
            expect(cacheService.set).toHaveBeenCalledWith(
                `transactions:user:${userId}`,
                expect.any(Array),
                30, // TTL de 30 segundos
            );
        });
    });

    /**
     * TESTE 7: Buscar transação por ID (COM CACHE)
     * Por quê? Validar cache de consultas individuais
     */
    describe('findById', () => {
        const userId = 'user-123';
        const transactionId = 'txn-1';

        it('deve retornar do cache se existir', async () => {
            const cachedTransaction = {
                id: transactionId,
                amount: 150,
                senderId: userId,
                receiverId: 'other-user'
            };
            cacheService.get.mockResolvedValue(cachedTransaction as any);

            const result = await service.findById(transactionId, userId);

            expect(result).toEqual(cachedTransaction);
            expect(transactionsRepository.findById).not.toHaveBeenCalled();
        });

        it('deve buscar no banco e cachear se não existe no cache', async () => {
            cacheService.get.mockResolvedValue(null);
            transactionsRepository.findById.mockResolvedValue(mockTransaction as any);

            const result = await service.findById('txn-789', mockSender.id);

            expect(result).toBeDefined();
            expect(result.id).toBe('txn-789');

            // Deve cachear
            expect(cacheService.set).toHaveBeenCalledWith(
                'transaction:txn-789',
                expect.any(Object),
                60,
            );
        });

        /**
         * TESTE 8: Transação não encontrada
         * Por quê? Tratar erro 404
         */
        it('deve retornar erro 404 se transação não existe', async () => {
            cacheService.get.mockResolvedValue(null);
            transactionsRepository.findById.mockResolvedValue(null);

            await expect(
                service.findById('non-existent', userId),
            ).rejects.toThrow(NotFoundException);
        });

        /**
         * TESTE: Transação sem permissão (não é sender nem receiver)
         * Por quê? Validar segurança
         */
        it('deve retornar erro 404 se usuário não tem permissão', async () => {
            const otherUserTransaction = {
                ...mockTransaction,
                senderId: 'other-user-1',
                receiverId: 'other-user-2',
            };
            cacheService.get.mockResolvedValue(null);
            transactionsRepository.findById.mockResolvedValue(otherUserTransaction as any);

            await expect(
                service.findById('txn-789', 'unauthorized-user'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    /**
     * TESTE 9: Atualizar status (COM INVALIDAÇÃO DE CACHE)
     * Por quê? Garantir que cache é limpo ao atualizar
     */
    describe('updateStatus', () => {
        const updateDto = {
            status: TransactionStatus.COMPLETED,
        };

        it('deve atualizar status e invalidar cache', async () => {
            transactionsRepository.findById
                .mockResolvedValueOnce(mockTransaction as any) // Primeira busca (verificação)
                .mockResolvedValueOnce({ ...mockTransaction, status: TransactionStatus.COMPLETED } as any); // Segunda busca (retorno)

            const result = await service.updateStatus('txn-789', updateDto);

            expect(result.status).toBe(TransactionStatus.COMPLETED);

            // Deve atualizar no banco
            expect(transactionsRepository.updateStatus).toHaveBeenCalledWith(
                'txn-789',
                TransactionStatus.COMPLETED,
            );

            // Deve invalidar caches (transação específica + listas dos usuários)
            expect(cacheService.del).toHaveBeenCalledWith('transaction:txn-789');
            expect(cacheService.del).toHaveBeenCalledWith(`transactions:user:${mockSender.id}`);
            expect(cacheService.del).toHaveBeenCalledWith(`transactions:user:${mockReceiver.id}`);
        });

        it('deve retornar erro 404 se transação não existe', async () => {
            transactionsRepository.findById.mockResolvedValue(null);

            await expect(
                service.updateStatus('non-existent', updateDto),
            ).rejects.toThrow(NotFoundException);

            expect(transactionsRepository.updateStatus).not.toHaveBeenCalled();
        });
    });
});
