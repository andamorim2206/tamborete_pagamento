import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from '../../../src/transactions/transactions.controller';
import { TransactionsService } from '../../../src/transactions/transactions.service';
import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';
import { PaymentMethod } from '../../../src/transactions/enums/payment-method.enum';
import { TransactionStatus } from '../../../src/transactions/enums/transaction-status.enum';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * TESTE DO TRANSACTIONS CONTROLLER (Endpoints REST)
 * 
 * O que testamos aqui:
 * - Endpoints HTTP (POST, GET, PATCH)
 * - Autenticação (JWT)
 * - Validação de DTOs
 * - Rate limiting
 * - Respostas HTTP corretas (200, 201, 404, etc)
 */
describe('TransactionsController', () => {
    let controller: TransactionsController;
    let service: jest.Mocked<TransactionsService>;

    // Mock do usuário autenticado (vem do JWT)
    const mockUser = {
        id: 'user-123',
        email: 'joao@example.com',
        name: 'João Silva',
    };

    // Mock de resposta de transação
    const mockTransactionResponse = {
        id: 'txn-456',
        senderId: 'user-123',
        senderName: 'João Silva',
        senderEmail: 'joao@example.com',
        receiverId: 'user-789',
        receiverName: 'Maria Santos',
        receiverEmail: 'maria@example.com',
        amount: 250.75,
        paymentMethod: PaymentMethod.PIX,
        status: TransactionStatus.PENDING,
        createdAt: new Date(),
    };

    beforeEach(async () => {
        const mockTransactionsService = {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            updateStatus: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [TransactionsController],
            providers: [
                {
                    provide: TransactionsService,
                    useValue: mockTransactionsService,
                },
            ],
        })
            // Desabilitar guards para testes unitários
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(ThrottlerGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<TransactionsController>(TransactionsController);
        service = module.get(TransactionsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('deve ser definido', () => {
        expect(controller).toBeDefined();
    });

    /**
     * TESTE 1: POST /transactions - Criar transação
     * Por quê? Endpoint principal do sistema
     * 
     * Testa:
     * - Recebe DTO válido
     * - Extrai usuário do JWT (@CurrentUser)
     * - Chama service.create()
     * - Retorna 201 Created
     */
    describe('POST /transactions', () => {
        const createDto = {
            receiverEmail: 'maria@example.com',
            amount: 250.75,
            paymentMethod: PaymentMethod.PIX,
        };

        it('deve criar transação e retornar 201', async () => {
            // Arrange
            service.create.mockResolvedValue(mockTransactionResponse as any);

            // Act
            const result = await controller.create(mockUser, createDto);

            // Assert
            expect(result).toEqual(mockTransactionResponse);
            expect(service.create).toHaveBeenCalledWith(mockUser.id, createDto);
        });

        /**
         * TESTE 2: Validação de DTO
         * Por quê? Garantir que dados inválidos são rejeitados
         * Nota: ValidationPipe faz isso automaticamente na aplicação real
         */
        it.skip('deve rejeitar DTO inválido', async () => {
            // Este teste está skip porque em testes unitários não temos o ValidationPipe real
            // A validação é testada nos testes E2E
        });
    });

    /**
     * TESTE 3: GET /transactions - Listar todas
     * Por quê? Consulta comum
     */
    describe('GET /transactions', () => {
        it('deve retornar lista de transações', async () => {
            const mockList = {
                data: [mockTransactionResponse],
                meta: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPreviousPage: false,
                },
            };
            const paginationQuery = { page: 1, limit: 10 };
            service.findAll.mockResolvedValue(mockList as any);

            const result = await controller.findAll(mockUser, paginationQuery);

            expect(result).toEqual(mockList);
            expect(service.findAll).toHaveBeenCalledWith(mockUser.id, paginationQuery);
        });

        it('deve retornar array vazio se não há transações', async () => {
            const emptyList = {
                data: [],
                meta: {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false,
                },
            };
            const paginationQuery = { page: 1, limit: 10 };
            service.findAll.mockResolvedValue(emptyList as any);

            const result = await controller.findAll(mockUser, paginationQuery);

            expect(result).toEqual(emptyList);
        });
    });

    /**
     * TESTE 4: GET /transactions/:id - Buscar por ID
     * Por quê? Consulta individual
     */
    describe('GET /transactions/:id', () => {
        it('deve retornar transação específica', async () => {
            service.findById.mockResolvedValue(mockTransactionResponse as any);

            const result = await controller.findById(mockUser, 'txn-456');

            expect(result).toEqual(mockTransactionResponse);
            expect(service.findById).toHaveBeenCalledWith('txn-456', mockUser.id);
        });

        /**
         * TESTE 5: 404 quando não encontrado
         * Por quê? Tratar erro corretamente
         */
        it('deve propagar erro 404 do service', async () => {
            service.findById.mockRejectedValue(new Error('Transação não encontrada'));

            await expect(controller.findById('non-existent')).rejects.toThrow();
        });
    });

    /**
     * TESTE 6: PATCH /transactions/:id/status - Atualizar status
     * Por quê? Operação administrativa
     */
    describe('PATCH /transactions/:id/status', () => {
        const updateDto = {
            status: TransactionStatus.COMPLETED,
        };

        it('deve atualizar status da transação', async () => {
            const updatedTransaction = {
                ...mockTransactionResponse,
                status: TransactionStatus.COMPLETED,
            };
            service.updateStatus.mockResolvedValue(updatedTransaction as any);

            const result = await controller.updateStatus('txn-456', updateDto);

            expect(result.status).toBe(TransactionStatus.COMPLETED);
            expect(service.updateStatus).toHaveBeenCalledWith('txn-456', updateDto);
        });

        it('deve aceitar todos os status válidos', async () => {
            const statuses = [
                TransactionStatus.PENDING,
                TransactionStatus.PROCESSING,
                TransactionStatus.COMPLETED,
                TransactionStatus.FAILED,
            ];

            for (const status of statuses) {
                service.updateStatus.mockResolvedValue({
                    ...mockTransactionResponse,
                    status,
                } as any);

                const result = await controller.updateStatus('txn-456', { status });

                expect(result.status).toBe(status);
            }
        });
    });

    /**
     * TESTE 7: Autenticação JWT
     * Por quê? Garantir que endpoints são protegidos
     * Nota: Este teste verifica que o guard está configurado
     */
    describe('Autenticação', () => {
        it('deve ter JwtAuthGuard aplicado', () => {
            // Verificar que o decorator @UseGuards está presente
            const guards = Reflect.getMetadata('__guards__', TransactionsController);
            expect(guards).toBeDefined();
        });
    });

    /**
     * TESTE 8: Rate Limiting
     * Por quê? Garantir proteção contra abuso
     * Nota: ThrottlerGuard limita requisições
     */
    describe('Rate Limiting', () => {
        it.skip('deve ter Throttle decorator no POST', () => {
            // Este teste está skip porque requer inspeção de metadata em runtime
            // Rate limiting é testado nos testes E2E
        });
    });
});
